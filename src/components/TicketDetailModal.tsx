import { useState, useEffect, useRef } from 'react';
import { X, Send, Clock, User, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SupportTicket, TicketComment } from '../types';

interface TicketDetailModalProps {
    ticket: SupportTicket;
    onClose: () => void;
    onUpdate: () => void;
}

export function TicketDetailModal({ ticket, onClose, onUpdate }: TicketDetailModalProps) {
    const [comments, setComments] = useState<TicketComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState(ticket.status);
    const [loading, setLoading] = useState(false);
    const [loadingComments, setLoadingComments] = useState(true);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchComments();
        // Mark as read or similar logic could go here
    }, [ticket.id]);

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchComments = async () => {
        try {
            // Assuming a table structure for comments
            const { data, error } = await supabase
                .from('ticket_comments')
                .select(`
          *,
          user:user_profiles(first_name, last_name, email, role)
        `)
                .eq('ticket_id', ticket.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus as any);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: newStatus })
                .eq('id', ticket.id);

            if (error) throw error;
            onUpdate();
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on error
            setStatus(ticket.status);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { error } = await supabase
                .from('ticket_comments')
                .insert({
                    ticket_id: ticket.id,
                    user_id: user.id,
                    message: newComment.trim(),
                    is_internal: false // Admin comments can be internal flag if needed later
                });

            if (error) throw error;

            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error sending comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">

                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        #{ticket.ticket_number}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 leading-6">
                                    {ticket.title}
                                </h3>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{ticket.creator?.first_name} {ticket.creator?.last_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(ticket.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row h-[600px]">
                        {/* Sidebar / Info */}
                        <div className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="waiting">Waiting for Customer</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Description
                                    </label>
                                    <div className="bg-white p-3 rounded-md border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                                        {ticket.description}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Organization
                                    </label>
                                    <div className="text-sm font-medium text-gray-900">
                                        {ticket.organization?.company_name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="w-full md:w-2/3 flex flex-col bg-white">
                            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                                {loadingComments ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map((comment) => {
                                            const isAdmin = comment.user?.role === 'super_admin';

                                            return (
                                                <div key={comment.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-lg p-3 ${isAdmin
                                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                                        }`}>
                                                        <div className="flex items-center gap-2 mb-1 opacity-75 text-xs">
                                                            <span className="font-semibold">
                                                                {comment.user?.first_name || 'User'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm">{comment.message}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={commentsEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <form onSubmit={handleSendComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !newComment.trim()}
                                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
