import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { profile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!profile) {
            setUnreadCount(0);
            return;
        }
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);

            if (!error) setUnreadCount(count || 0);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    }, [profile]);

    // Fetch on mount and when profile changes
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Poll every 30 seconds for new notifications
    useEffect(() => {
        if (!profile) return;
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [profile, fetchUnreadCount]);

    // Called when a notification is marked as read
    const markRead = useCallback(() => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Called when a notification is deleted (if it was unread)
    const decrementIfUnread = useCallback((wasUnread) => {
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    }, []);

    // Force refresh count
    const refreshCount = useCallback(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, markRead, decrementIfUnread, refreshCount }}>
            {children}
        </NotificationContext.Provider>
    );
};
