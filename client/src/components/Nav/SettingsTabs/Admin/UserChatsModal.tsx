import { useToastContext, Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { getLatestText } from '~/utils';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function UserChatsModal({ isOpen, onClose, userId, userName }) {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            setConversations([]);
            setPage(1);
            setHasMore(true);
            setSelectedConvo(null);
            fetchConversations(1);
        }
    }, [isOpen, userId]);

    const fetchConversations = async (pageNum) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/admin/users/${userId}/conversations?page=${pageNum}&limit=20`);
            setConversations(prev => pageNum === 1 ? res.data.conversations : [...prev, ...res.data.conversations]);
            setHasMore(pageNum < res.data.pages);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            showToast({ message: 'Error fetching conversations', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchConversations(nextPage);
        }
    };

    const handleSelectConvo = async (convo) => {
        setSelectedConvo(convo);
        try {
            setMessagesLoading(true);
            const res = await axios.get(`/api/admin/users/${userId}/conversations/${convo.conversationId}`);
            setMessages(res.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            showToast({ message: 'Error fetching messages', status: 'error' });
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedConvo(null);
        setMessages([]);
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all h-[80vh] flex flex-col">
                                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center mb-4">
                                    <span>
                                        Chat History: {userName}
                                        {selectedConvo && <span className="text-sm font-normal text-gray-500 ml-2"> / {selectedConvo.title || 'New Chat'}</span>}
                                    </span>
                                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        ✕
                                    </button>
                                </DialogTitle>

                                <div className="flex-1 overflow-hidden flex flex-col">
                                    {!selectedConvo ? (
                                        <div className="flex-1 overflow-y-auto">
                                            {loading && conversations.length === 0 ? (
                                                <div className="flex justify-center p-4"><Spinner /></div>
                                            ) : conversations.length === 0 ? (
                                                <div className="text-center p-4 text-gray-500">No conversations found.</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {conversations.map(convo => (
                                                        <div
                                                            key={convo.conversationId}
                                                            onClick={() => handleSelectConvo(convo)}
                                                            className="p-3 border rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700 transition-colors"
                                                        >
                                                            <div className="flex justify-between">
                                                                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate pr-4">{convo.title || 'New Chat'}</span>
                                                                <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(convo.updatedAt).toLocaleString()}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">{convo.model}</div>
                                                        </div>
                                                    ))}
                                                    {hasMore && (
                                                        <button
                                                            onClick={handleLoadMore}
                                                            disabled={loading}
                                                            className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 disabled:opacity-50"
                                                        >
                                                            {loading ? 'Loading...' : 'Load More'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col h-full">
                                            <button
                                                onClick={handleBack}
                                                className="mb-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                ← Back to list
                                            </button>
                                            <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                                                {messagesLoading ? (
                                                    <div className="flex justify-center h-full items-center"><Spinner /></div>
                                                ) : messages.length === 0 ? (
                                                    <div className="text-center text-gray-500">No messages in this conversation.</div>
                                                ) : (
                                                    messages.map((msg, idx) => (
                                                        <div key={msg.messageId || idx} className={`flex flex-col ${msg.isCreatedByUser ? 'items-end' : 'items-start'}`}>
                                                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.isCreatedByUser
                                                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                                                                : 'bg-white border text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                                                                }`}>
                                                                {msg.text ? (
                                                                    <div className="prose dark:prose-invert text-sm max-w-none">
                                                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                                    </div>
                                                                ) : (
                                                                    <span className="italic text-gray-500">No text content</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 mt-1">
                                                                {msg.isCreatedByUser ? 'User' : msg.sender || 'AI'} • {new Date(msg.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
