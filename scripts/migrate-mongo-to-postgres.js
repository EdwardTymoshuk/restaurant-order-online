#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { MongoClient, ObjectId } = require('mongodb')
const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')

const ROOT = process.cwd()

function loadEnvFile(filename) {
	const filePath = path.join(ROOT, filename)
	if (fs.existsSync(filePath)) {
		dotenv.config({ path: filePath, override: false })
	}
}

function isPostgresUrl(url) {
	return typeof url === 'string' && /^(postgres|postgresql):\/\//i.test(url)
}

function toId(value) {
	if (!value) return null
	if (value instanceof ObjectId) return value.toString()
	if (typeof value === 'object' && typeof value.toString === 'function') return value.toString()
	return String(value)
}

function toDate(value, fallback = new Date()) {
	if (!value) return fallback
	const date = value instanceof Date ? value : new Date(value)
	return Number.isNaN(date.getTime()) ? fallback : date
}

function toBool(value, fallback = false) {
	if (typeof value === 'boolean') return value
	if (value === 'true' || value === '1' || value === 1) return true
	if (value === 'false' || value === '0' || value === 0) return false
	return fallback
}

function toNumber(value, fallback = 0) {
	const num = Number(value)
	return Number.isFinite(num) ? num : fallback
}

function toOptionalInt(value) {
	if (value === null || value === undefined || value === '') return null
	const num = Number(value)
	if (!Number.isFinite(num)) return null
	return Math.trunc(num)
}

function toPlain(value) {
	if (value === null || value === undefined) return value
	if (value instanceof ObjectId) return value.toString()
	if (value instanceof Date) return value.toISOString()
	if (Array.isArray(value)) return value.map((entry) => toPlain(entry))
	if (typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, val]) => [key, toPlain(val)])
		)
	}
	return value
}

function normalizeDeliveryMethod(value) {
	const normalized = String(value || '').toUpperCase()
	if (normalized === 'DELIVERY') return 'DELIVERY'
	if (normalized === 'TAKE_OUT') return 'TAKE_OUT'
	if (normalized === 'TAKEOUT' || normalized === 'PICKUP') return 'TAKE_OUT'
	return 'DELIVERY'
}

function normalizeOrderStatus(value) {
	const normalized = String(value || '').toUpperCase()
	const allowed = new Set([
		'PENDING',
		'ACCEPTED',
		'IN_PROGRESS',
		'READY',
		'DELIVERING',
		'DELIVERED',
		'COMPLETED',
		'CANCELLED',
	])
	return allowed.has(normalized) ? normalized : 'PENDING'
}

function normalizeDiscountType(value) {
	const normalized = String(value || '').toUpperCase()
	return normalized === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED'
}

function normalizeEmail(value) {
	if (!value) return null
	const email = String(value).trim().toLowerCase()
	return email || null
}

function purgeEntriesOwnedBy(map, ownerId) {
	for (const [key, value] of map.entries()) {
		if (value === ownerId) map.delete(key)
	}
}

function ensureUniqueUsername(baseUsername, ownerId, mongoId, usernameToId) {
	const fallback = `user-${mongoId.slice(-6)}`
	const base = (baseUsername || fallback).trim() || fallback
	let candidate = base
	let attempt = 0

	while (true) {
		const key = candidate.toLowerCase()
		const currentOwner = usernameToId.get(key)
		if (!currentOwner || currentOwner === ownerId) return candidate
		attempt += 1
		candidate = `${base}-${mongoId.slice(-6)}${attempt > 1 ? `-${attempt}` : ''}`
	}
}

async function main() {
	loadEnvFile('.env')
	loadEnvFile('.env.local')
	loadEnvFile('.env.production')

	const postgresUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL
	const mongoUrl =
		process.env.MONGO_DATABASE_URL ||
		process.env.MONGO_URL ||
		process.env.OLD_MONGO_DATABASE_URL

	if (!isPostgresUrl(postgresUrl)) {
		throw new Error(
			'Brak poprawnego URL PostgreSQL. Ustaw DATABASE_URL lub POSTGRES_DATABASE_URL.'
		)
	}

	if (!mongoUrl || !/^mongodb(\+srv)?:\/\//i.test(mongoUrl)) {
		throw new Error(
			'Brak URL do MongoDB. Ustaw MONGO_DATABASE_URL (lub MONGO_URL / OLD_MONGO_DATABASE_URL).'
		)
	}

	let mongoDbName =
		process.env.MONGO_DB_NAME ||
		(() => {
			try {
				const pathname = new URL(mongoUrl).pathname
				const dbName = pathname.startsWith('/') ? pathname.slice(1) : pathname
				return dbName || null
			} catch (error) {
				return null
			}
		})()

	console.log('PostgreSQL target: DATABASE_URL')

	const prisma = new PrismaClient({
		datasources: {
			db: { url: postgresUrl },
		},
	})
	const mongo = new MongoClient(mongoUrl)

	const stats = {
		User: 0,
		PromoCode: 0,
		MenuItem: 0,
		Banner: 0,
		MainBanner: 0,
		News: 0,
		Settings: 0,
		Order: 0,
		OrderItem: 0,
		OrderItemSkipped: 0,
	}

	try {
		await mongo.connect()
		await prisma.$connect()

		if (!mongoDbName) {
			const admin = mongo.db().admin()
			const listed = await admin.listDatabases()
			const candidates = listed.databases
				.map((dbInfo) => dbInfo.name)
				.filter(
					(name) =>
						!['admin', 'local', 'config', 'test'].includes(name.toLowerCase())
				)

			for (const candidate of candidates) {
				const candidateCollections = await mongo
					.db(candidate)
					.listCollections({}, { nameOnly: true })
					.toArray()
				const collectionNames = new Set(
					candidateCollections.map((entry) => entry.name)
				)
				const required = ['User', 'MenuItem', 'Order', 'OrderItem']
				const matchScore = required.filter((name) => collectionNames.has(name)).length
				if (matchScore >= 3) {
					mongoDbName = candidate
					break
				}
			}
		}

		if (!mongoDbName) {
			throw new Error(
				'Nie moge odczytac nazwy bazy Mongo. Ustaw MONGO_DB_NAME recznie.'
			)
		}

		console.log(`Mongo source: ${mongoDbName}`)

		const db = mongo.db(mongoDbName)

		const existingUsers = await prisma.user.findMany({
			select: { id: true, email: true, username: true },
		})
		const userIdSet = new Set(existingUsers.map((user) => user.id))
		const emailToId = new Map()
		const usernameToId = new Map()
		for (const user of existingUsers) {
			if (user.email) emailToId.set(String(user.email).toLowerCase(), user.id)
			if (user.username) usernameToId.set(String(user.username).toLowerCase(), user.id)
		}

		const users = await db.collection('User').find({}).toArray()
		for (const doc of users) {
			const mongoId = toId(doc._id)
			if (!mongoId) continue

			const email = normalizeEmail(doc.email)
			const preferredUsername = String(
				doc.username || email || `user-${mongoId.slice(-6)}`
			).trim()

			let targetId = userIdSet.has(mongoId) ? mongoId : null
			if (!targetId && email) targetId = emailToId.get(email) || null
			if (!targetId && preferredUsername) {
				targetId = usernameToId.get(preferredUsername.toLowerCase()) || null
			}
			if (!targetId) targetId = mongoId

			purgeEntriesOwnedBy(emailToId, targetId)
			purgeEntriesOwnedBy(usernameToId, targetId)

			let safeEmail = email
			if (safeEmail) {
				const owner = emailToId.get(safeEmail)
				if (owner && owner !== targetId) safeEmail = null
			}

			const safeUsername = ensureUniqueUsername(
				preferredUsername,
				targetId,
				mongoId,
				usernameToId
			)

			const data = {
				username: safeUsername,
				email: safeEmail,
				name: doc.name ?? null,
				password: doc.password || '',
				role: doc.role || 'user',
				createdAt: toDate(doc.createdAt),
			}

			if (userIdSet.has(targetId)) {
				await prisma.user.update({
					where: { id: targetId },
					data,
				})
			} else {
				await prisma.user.create({
					data: { id: targetId, ...data },
				})
			}

			userIdSet.add(targetId)
			usernameToId.set(safeUsername.toLowerCase(), targetId)
			if (safeEmail) emailToId.set(safeEmail, targetId)
			stats.User += 1
		}

		const existingPromoCodes = await prisma.promoCode.findMany({
			select: { id: true, code: true },
		})
		const promoIdSet = new Set(existingPromoCodes.map((promo) => promo.id))
		const promoCodeToId = new Map()
		for (const promo of existingPromoCodes) {
			if (promo.code) promoCodeToId.set(promo.code, promo.id)
		}

		const promoCodes = await db.collection('PromoCode').find({}).toArray()
		for (const doc of promoCodes) {
			const mongoId = toId(doc._id)
			if (!mongoId) continue
			const code = String(doc.code || mongoId)

			let targetId = promoIdSet.has(mongoId) ? mongoId : null
			if (!targetId && code) targetId = promoCodeToId.get(code) || null
			if (!targetId) targetId = mongoId

			purgeEntriesOwnedBy(promoCodeToId, targetId)

			let safeCode = code
			if (!safeCode) safeCode = mongoId
			const owner = promoCodeToId.get(safeCode)
			if (owner && owner !== targetId) {
				safeCode = `${safeCode}-${mongoId.slice(-6)}`
			}

			const data = {
				code: safeCode,
				discountType: normalizeDiscountType(doc.discountType),
				discountValue: toNumber(doc.discountValue, 0),
				isActive: toBool(doc.isActive, true),
				isOneTimeUse: toBool(doc.isOneTimeUse, false),
				isUsed: toBool(doc.isUsed, false),
				startDate: doc.startDate ? toDate(doc.startDate) : null,
				expiresAt: doc.expiresAt ? toDate(doc.expiresAt) : null,
				createdAt: toDate(doc.createdAt),
				updatedAt: toDate(doc.updatedAt),
			}

			if (promoIdSet.has(targetId)) {
				await prisma.promoCode.update({
					where: { id: targetId },
					data,
				})
			} else {
				await prisma.promoCode.create({
					data: { id: targetId, ...data },
				})
			}

			promoIdSet.add(targetId)
			promoCodeToId.set(safeCode, targetId)
			stats.PromoCode += 1
		}

		const menuItems = await db.collection('MenuItem').find({}).toArray()
		for (const doc of menuItems) {
			const id = toId(doc._id)
			if (!id) continue
			await prisma.menuItem.upsert({
				where: { id },
				update: {
					name: doc.name || 'Pozycja bez nazwy',
					price: toNumber(doc.price, 0),
					description: doc.description ?? null,
					image: doc.image ?? null,
					category: doc.category || 'Inne',
					isRecommended: toBool(doc.isRecommended, false),
					isActive: toBool(doc.isActive, true),
					isOrderable: toBool(doc.isOrderable, false),
					isOnMainPage: toBool(doc.isOnMainPage, false),
					createdAt: toDate(doc.createdAt),
					updatedAt: toDate(doc.updatedAt),
				},
				create: {
					id,
					name: doc.name || 'Pozycja bez nazwy',
					price: toNumber(doc.price, 0),
					description: doc.description ?? null,
					image: doc.image ?? null,
					category: doc.category || 'Inne',
					isRecommended: toBool(doc.isRecommended, false),
					isActive: toBool(doc.isActive, true),
					isOrderable: toBool(doc.isOrderable, false),
					isOnMainPage: toBool(doc.isOnMainPage, false),
					createdAt: toDate(doc.createdAt),
					updatedAt: toDate(doc.updatedAt),
				},
			})
			stats.MenuItem += 1
		}

		const banners = await db.collection('Banner').find({}).toArray()
		for (const doc of banners) {
			const id = toId(doc._id)
			if (!id) continue
			await prisma.banner.upsert({
				where: { id },
				update: {
					imageUrl: doc.imageUrl || '',
					linkUrl: doc.linkUrl ?? null,
					position: doc.position ?? null,
					createdAt: toDate(doc.createdAt),
					updatedAt: toDate(doc.updatedAt),
				},
				create: {
					id,
					imageUrl: doc.imageUrl || '',
					linkUrl: doc.linkUrl ?? null,
					position: doc.position ?? null,
					createdAt: toDate(doc.createdAt),
					updatedAt: toDate(doc.updatedAt),
				},
			})
			stats.Banner += 1
		}

		const mainBanners = await db.collection('MainBanner').find({}).toArray()
		for (const doc of mainBanners) {
			const id = toId(doc._id)
			if (!id) continue
			await prisma.mainBanner.upsert({
				where: { id },
				update: {
					desktopImageUrl: doc.desktopImageUrl || '',
					mobileImageUrl: doc.mobileImageUrl ?? null,
					linkUrl: doc.linkUrl ?? null,
					position: toNumber(doc.position, 0),
					createdAt: toDate(doc.createdAt),
				},
				create: {
					id,
					desktopImageUrl: doc.desktopImageUrl || '',
					mobileImageUrl: doc.mobileImageUrl ?? null,
					linkUrl: doc.linkUrl ?? null,
					position: toNumber(doc.position, 0),
					createdAt: toDate(doc.createdAt),
				},
			})
			stats.MainBanner += 1
		}

		const newsList = await db.collection('News').find({}).toArray()
		for (const doc of newsList) {
			const id = toId(doc._id)
			if (!id) continue
			const galleryImages = Array.isArray(doc.galleryImages)
				? doc.galleryImages.map((value) => String(value))
				: []
			await prisma.news.upsert({
				where: { id },
				update: {
					title: doc.title || 'Aktualnosc',
					image: doc.image || '',
					description: doc.description || '',
					fullDescription: doc.fullDescription || '',
					galleryImages,
					createdAt: toDate(doc.createdAt),
				},
				create: {
					id,
					title: doc.title || 'Aktualnosc',
					image: doc.image || '',
					description: doc.description || '',
					fullDescription: doc.fullDescription || '',
					galleryImages,
					createdAt: toDate(doc.createdAt),
				},
			})
			stats.News += 1
		}

		const settingsList = await db.collection('Settings').find({}).toArray()
		for (const doc of settingsList) {
			const id = toId(doc._id)
			if (!id) continue
			await prisma.settings.upsert({
				where: { id },
				update: {
					isOrderingOpen: toBool(doc.isOrderingOpen, true),
					orderWaitTime: toNumber(doc.orderWaitTime, 30),
					deliveryCost: toNumber(doc.deliveryCost, 0),
					deliveryZones: toPlain(doc.deliveryZones ?? []),
					pizzaCategoryEnabled: toBool(doc.pizzaCategoryEnabled, true),
					pizzaAvailability: toPlain(doc.pizzaAvailability ?? []),
					updatedAt: toDate(doc.updatedAt),
					createdAt: toDate(doc.createdAt),
				},
				create: {
					id,
					isOrderingOpen: toBool(doc.isOrderingOpen, true),
					orderWaitTime: toNumber(doc.orderWaitTime, 30),
					deliveryCost: toNumber(doc.deliveryCost, 0),
					deliveryZones: toPlain(doc.deliveryZones ?? []),
					pizzaCategoryEnabled: toBool(doc.pizzaCategoryEnabled, true),
					pizzaAvailability: toPlain(doc.pizzaAvailability ?? []),
					updatedAt: toDate(doc.updatedAt),
					createdAt: toDate(doc.createdAt),
				},
			})
			stats.Settings += 1
		}

		const promoIds = new Set(promoCodes.map((doc) => toId(doc._id)).filter(Boolean))
		const orders = await db.collection('Order').find({}).toArray()
		for (const doc of orders) {
			const id = toId(doc._id)
			if (!id) continue
			const promoCodeId = toId(doc.promoCodeId)
			await prisma.order.upsert({
				where: { id },
				update: {
					name: doc.name || 'Bez imienia',
					phone: doc.phone || '',
					city: doc.city ?? null,
					postalCode: doc.postalCode ?? null,
					street: doc.street ?? null,
					buildingNumber: doc.buildingNumber ?? null,
					apartment: toOptionalInt(doc.apartment),
					nip: doc.nip ?? null,
					deliveryMethod: normalizeDeliveryMethod(doc.deliveryMethod),
					paymentMethod: doc.paymentMethod || 'cash',
					deliveryTime: toDate(doc.deliveryTime),
					totalAmount: toNumber(doc.totalAmount, 0),
					finalAmount:
						doc.finalAmount === null || doc.finalAmount === undefined
							? null
							: toNumber(doc.finalAmount, 0),
					status: normalizeOrderStatus(doc.status),
					statusUpdatedAt: toDate(doc.statusUpdatedAt),
					notifiedAt: doc.notifiedAt ? toDate(doc.notifiedAt) : null,
					comment: doc.comment ?? null,
					promoCodeId: promoCodeId && promoIds.has(promoCodeId) ? promoCodeId : null,
					createdAt: toDate(doc.createdAt),
					updatedAt: toDate(doc.updatedAt),
				},
				create: {
					id,
					name: doc.name || 'Bez imienia',
					phone: doc.phone || '',
					city: doc.city ?? null,
					postalCode: doc.postalCode ?? null,
					street: doc.street ?? null,
					buildingNumber: doc.buildingNumber ?? null,
					apartment: toOptionalInt(doc.apartment),
					nip: doc.nip ?? null,
					deliveryMethod: normalizeDeliveryMethod(doc.deliveryMethod),
					paymentMethod: doc.paymentMethod || 'cash',
					deliveryTime: toDate(doc.deliveryTime),
					totalAmount: toNumber(doc.totalAmount, 0),
					finalAmount:
						doc.finalAmount === null || doc.finalAmount === undefined
							? null
							: toNumber(doc.finalAmount, 0),
					status: normalizeOrderStatus(doc.status),
					statusUpdatedAt: toDate(doc.statusUpdatedAt),
					notifiedAt: doc.notifiedAt ? toDate(doc.notifiedAt) : null,
					comment: doc.comment ?? null,
					promoCodeId: promoCodeId && promoIds.has(promoCodeId) ? promoCodeId : null,
					createdAt: toDate(doc.createdAt),
					updatedAt: toDate(doc.updatedAt),
				},
			})
			stats.Order += 1
		}

		const validMenuItemIds = new Set(menuItems.map((doc) => toId(doc._id)).filter(Boolean))
		const validOrderIds = new Set(orders.map((doc) => toId(doc._id)).filter(Boolean))

		const orderItems = await db.collection('OrderItem').find({}).toArray()
		for (const doc of orderItems) {
			const id = toId(doc._id)
			const orderId = toId(doc.orderId)
			const menuItemId = toId(doc.menuItemId)
			if (!id || !orderId || !menuItemId) {
				stats.OrderItemSkipped += 1
				continue
			}
			if (!validOrderIds.has(orderId) || !validMenuItemIds.has(menuItemId)) {
				stats.OrderItemSkipped += 1
				continue
			}
			await prisma.orderItem.upsert({
				where: { id },
				update: {
					quantity: Math.max(1, toNumber(doc.quantity, 1)),
					orderId,
					menuItemId,
				},
				create: {
					id,
					quantity: Math.max(1, toNumber(doc.quantity, 1)),
					orderId,
					menuItemId,
				},
			})
			stats.OrderItem += 1
		}

		console.table(stats)
		console.log('Migracja zakonczona.')
	} finally {
		await Promise.allSettled([mongo.close(), prisma.$disconnect()])
	}
}

main().catch((error) => {
	console.error('Migracja nie powiodla sie:')
	console.error(error)
	process.exit(1)
})
