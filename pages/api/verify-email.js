export default async function handler(req, res) {
    console.log('API Request received:', {
        method: req.method,
        body: req.body,
        headers: req.headers
    });

    if (req.method !== 'POST') {
        console.error('Invalid method:', req.method);
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        const { email, action } = req.body;
        
        console.log('Processing request:', { email, action });

        if (!email) {
            console.error('No email provided in request');
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        if (action !== 'register') {
            console.error('Invalid action:', action);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action' 
            });
        }

        // Add your email validation logic here
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('Invalid email format:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        console.log('Registration successful for:', email);
        
        // Return success response with tokens
        return res.status(200).json({
            success: true,
            message: 'Registration successful',
            tokens: 20,
            email: email
        });

    } catch (error) {
        console.error('Server error:', {
            message: error.message,
            stack: error.stack
        });
        
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
} 