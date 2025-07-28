import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface AccomplishmentData {
  _id: string;
  description: string;
  employee: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendNewAccomplishment: (accomplishmentData: AccomplishmentData) => void;
  sendAccomplishmentReviewed: (accomplishmentId: string, employeeId: string) => void;
  sendNewComment: (accomplishmentId: string, employeeId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    let socketInstance: Socket;

    if (isAuthenticated && user) {
      // Connect to socket server
      socketInstance = io('http://localhost:5000', {
        withCredentials: true,
      });

      // Set socket state
      setSocket(socketInstance);

      // Socket events
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setConnected(true);

        // Join rooms based on user role and id
        socketInstance.emit('joinRoom', { userId: user.id, role: user.role });
      });

      // Handle notifications for managers
      if (user.role === 'manager') {
        socketInstance.on('newAccomplishmentAlert', (data) => {
          toast({
            title: t('notifications.newAccomplishment', { name: data.employee.name }),
            description: data.description?.substring(0, 50) + '...',
          });
        });
      }

      // Handle notifications for employees
      if (user.role === 'employee') {
        socketInstance.on('accomplishmentReviewedAlert', (data) => {
          toast({
            title: t('notifications.accomplishmentReviewed'),
          });
        });

        socketInstance.on('newCommentAlert', (data) => {
          toast({
            title: t('notifications.newComment'),
          });
        });
      }

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user, toast, t]);

  // Send new accomplishment notification
  const sendNewAccomplishment = (accomplishmentData: AccomplishmentData) => {
    if (socket && connected) {
      socket.emit('newAccomplishment', accomplishmentData);
    }
  };

  // Send accomplishment reviewed notification
  const sendAccomplishmentReviewed = (accomplishmentId: string, employeeId: string) => {
    if (socket && connected) {
      socket.emit('accomplishmentReviewed', { accomplishmentId, employeeId });
    }
  };

  // Send new comment notification
  const sendNewComment = (accomplishmentId: string, employeeId: string) => {
    if (socket && connected) {
      socket.emit('newComment', { accomplishmentId, employeeId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        sendNewAccomplishment,
        sendAccomplishmentReviewed,
        sendNewComment
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};