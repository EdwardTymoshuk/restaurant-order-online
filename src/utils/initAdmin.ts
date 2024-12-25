import { prisma } from '@/lib/prisma'
// scripts/initAdmin.ts
import bcrypt from 'bcryptjs'

async function createInitialAdmin() {
	const adminEmail = 'admin@example.com' // Вкажіть потрібний емейл
	const adminUsername = 'admin'
	const adminPassword = 'securePassword' // Задайте надійний пароль

	// Перевірка, чи вже існує адмін
	const existingAdmin = await prisma.user.findUnique({
		where: { email: adminEmail },
	})

	if (existingAdmin) {
		return
	}

	// Створення нового адміністратора
	const hashedPassword = await bcrypt.hash(adminPassword, 10)
	await prisma.user.create({
		data: {
			username: adminUsername,
			email: adminEmail,
			password: hashedPassword,
			role: 'admin',
		},
	})
}

createInitialAdmin()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
