import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatButton from './ChatButton';
import ChatDialog from './ChatDialog';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Only show for authenticated users
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Show button when closed, dialog when open */}
      {!isOpen && <ChatButton onClick={handleOpen} />}
      {isOpen && <ChatDialog onClose={handleClose} />}
    </>
  );
};

export default ChatWidget;
