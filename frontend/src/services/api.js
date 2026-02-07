import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * API service for communicating with the Flask backend
 */
const api = {
    /**
     * Tokenize C code
     * @param {string} code - C source code to tokenize
     * @returns {Promise<Array>} Array of tokens
     */
    tokenize: async (code) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/tokenize`, {
                code: code
            });
            return response.data;
        } catch (error) {
            console.error('Tokenization error:', error);
            throw error;
        }
    },

    /**
     * Health check
     * @returns {Promise<Object>} API status
     */
    healthCheck: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/`);
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
};

export default api;
