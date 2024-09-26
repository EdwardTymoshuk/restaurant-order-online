import { PutObjectCommand } from '@aws-sdk/client-s3'
import R2Client from './r2Client'

export const uploadToR2 = async (buffer: Buffer, key: string, contentType: string): Promise<string> => {
	const params = {
		Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'spoko-sopot',
		Key: key,
		Body: buffer,
		ContentType: contentType,
	}

	const command = new PutObjectCommand(params)
	await R2Client.send(command)

	return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
}
