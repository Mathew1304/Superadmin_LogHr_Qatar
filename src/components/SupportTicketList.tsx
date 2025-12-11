import { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Clock, CheckCircle, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SupportTicket } from '../types';
import { TicketDetailModal } from './TicketDetailModal';

export function SupportTicketList() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('support_tickets')
                .select(`
          *,
          organization:organizations(company_name),
          creator:user_profiles!created_by(first_name, last_name, email)
        `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.organization?.company_name.toLowerCase().includes(search.toLowerCase())
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-purple-100 text-purple-800';
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <AlertCircle className="w-4 h-4" />;
            case 'in_progress': return <Clock className="w-4 h-4" />;
            case 'resolved': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${statusFilter === status
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ticket List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-lg font-medium">No tickets found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className="group p-5 hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full mt-1 ${getStatusColor(ticket.status)} bg-opacity-10`}>
                                            {getStatusIcon(ticket.status)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    #{ticket.ticket_number}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                {ticket.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                                                {ticket.description}
                                            </p>

                                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    <span>{ticket.organization?.company_name || 'Unknown Org'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {ticket.creator && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        <span>{ticket.creator.first_name} {ticket.creator.last_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pl-14 sm:pl-0">
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ').toUpperCase()}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={fetchTickets}
                />
            )}
        </div>
    );
}

// Helper icons needed for the component
import { Building2, Users } from 'lucide-react';
