import { router } from './trpc'

export const imageRouter = router({
	// uploadImage: publicProcedure
	// 	.input(z.object({
	// 		file: z.instanceof(Blob), // Зверніть увагу на правильне визначення типу
	// 		productName: z.string(),
	// 	}))
	// 	.mutation(async ({ input }) => {
	// 		const { file, productName } = input
	// 		const imageUrl = await uploadToR2(file, productName)
	// 		return imageUrl
	// 	}),
})
