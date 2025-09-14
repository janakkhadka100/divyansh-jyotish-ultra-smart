import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/lib/prisma';
import UltraSmartChatInterface from '@/components/chat/UltraSmartChatInterface';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ChatPageProps {
  searchParams: { sessionId?: string };
}

async function getSessionData(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        birth: true,
        result: true,
      },
    });

    if (!session) {
      return null;
    }

    return {
      birth: session.birth,
      result: session.result,
    };
  } catch (error) {
    console.error('Error fetching session data:', error);
    return null;
  }
}

function ChatPageSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading chat interface...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NoSessionFound() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The session you're looking for doesn't exist or has expired.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { sessionId } = searchParams;

  if (!sessionId) {
    return <NoSessionFound />;
  }

  const sessionData = await getSessionData(sessionId);

  if (!sessionData) {
    return <NoSessionFound />;
  }

  // Determine language from session or default to Nepali
  const language = (sessionData.birth?.tzId?.includes('Asia/Kathmandu') ? 'ne' : 'en') as 'ne' | 'hi' | 'en';

        return (
          <Suspense fallback={<ChatPageSkeleton />}>
            <UltraSmartChatInterface
              sessionId={sessionId}
              sessionData={sessionData}
              initialLanguage={language}
            />
          </Suspense>
        );
}