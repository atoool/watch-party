import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userData, setUserData] = useState(() => {
        // Try to get initial data from sessionStorage
        const savedData = sessionStorage.getItem('watchPartyUser');
        return savedData ? JSON.parse(savedData) : { username: '', channel: '' };
    });
    const navigate = useNavigate();

    // Update sessionStorage when userData changes
    useEffect(() => {
        if (userData.username && userData.channel) {
            sessionStorage.setItem('watchPartyUser', JSON.stringify(userData));
        }
    }, [userData]);

    const updateUserData = (username, channel) => {
        setUserData({ username, channel });
    };

    const clearUserData = () => {
        setUserData({ username: '', channel: '' });
        sessionStorage.removeItem('watchPartyUser');
        navigate('/');
    };

    return (
        <UserContext.Provider value={{ userData, updateUserData, clearUserData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}; 