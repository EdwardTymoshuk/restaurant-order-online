import { S3Client } from '@aws-sdk/client-s3'

const R2Client = new S3Client({
	endpoint: 'https://7ca9cbc09d9b4263fed95680f6333dfd.r2.cloudflarestorage.com',
	credentials: {
		accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
	},
	region: 'auto',
})

export default R2Client
