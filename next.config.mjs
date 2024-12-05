/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: ['spoko-sopot.r2.cloudflarestorage.com', 'pub-6b43bbf3eb884034863e85b0eefe37a8.r2.dev'],
		minimumCacheTTL: 3600,
	},
}

export default nextConfig
