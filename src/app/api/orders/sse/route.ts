import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Встановлення SSE-з'єднання
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                const eventData = `data: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(eventData));
            };

            // Функція для отримання нових замовлень
            const fetchNewOrders = async () => {
                try {
                    const newOrders = await prisma.order.findMany({
                        where: {
                            createdAt: { gte: new Date(Date.now() - 60 * 1000) }, // Остання хвилина
                        },
                        orderBy: { createdAt: 'desc' },
                    });

                    sendEvent({ orders: newOrders });
                } catch (error) {
                    console.error('Error fetching orders:', error);
                }
            };

            // Початковий виклик
            await fetchNewOrders();

            // Інтервал оновлення даних (кожні 5 секунд)
            const interval = setInterval(fetchNewOrders, 5000);

            // Закриття стріму при відключенні клієнта
            const closeStream = () => {
                clearInterval(interval);
                controller.close();
            };

            req.signal.addEventListener('abort', closeStream);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
