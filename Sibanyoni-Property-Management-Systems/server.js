require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Maintenance = require('./models/Maintenance');

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================
// MONGODB CONNECTION
// =====================================================

const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas successfully!');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role, specialty, secretCode, agreedToTerms } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: 'Please provide all required fields.'
            });
        }

        // Validate Terms and Conditions Acceptance
        if (!agreedToTerms) {
            return res.status(400).json({
                message: 'You must accept the Terms and Conditions to register.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Admin Security Check
        if (role === 'admin') {
            if (!secretCode || secretCode !== '23232') {
                return res.status(403).json({
                    message: 'Invalid Admin security code.'
                });
            }
        }

        // Technician Security Check
        if (role === 'technician') {
            if (!secretCode || secretCode !== '23123') {
                return res.status(403).json({
                    message: 'Invalid Technician security code.'
                });
            }
        }

        // Check Existing User
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email address.'
            });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            specialty: role === 'technician' ? specialty : undefined,
            agreedToTerms: Boolean(agreedToTerms)
        });

        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully'
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({
            message: 'Server error: ' + err.message
        });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                message: 'User account not found. Please register.'
            });
        }

        // Support for hashed passwords with fallback to plain text if upgrading existing DB records
        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch && user.password === password) {
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid password'
            });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id.toString(),
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                specialty: user.specialty
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            message: 'Server error: ' + err.message
        });
    }
});

// =====================================================
// MAINTENANCE / TICKET ROUTES
// =====================================================

// CREATE MAINTENANCE TICKET
app.post(['/api/tickets', '/api/maintenance'], async (req, res) => {
    try {
        const { userId, roomNo, title, category, priority, description } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }
        if (!roomNo || !roomNo.trim()) {
            return res.status(400).json({ message: 'Room No is required.' });
        }
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Issue title is required.' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ message: 'Description is required.' });
        }

        const newTicket = new Maintenance({
            userId,
            roomNo: roomNo.trim(),
            title: title.trim(),
            category: category || 'Other',
            priority: priority || 'Medium',
            description: description.trim(),
            status: 'Pending'
        });

        await newTicket.save();

        console.log('New maintenance ticket created:', newTicket._id.toString());
        console.log('Room No:', newTicket.roomNo);

        res.status(201).json({
            message: 'Ticket created successfully',
            ticket: newTicket
        });

    } catch (err) {
        console.error('Create ticket error:', err);
        res.status(500).json({
            message: 'Error creating ticket: ' + err.message
        });
    }
});

// GET ALL TICKETS
app.get(['/api/tickets', '/api/maintenance'], async (req, res) => {
    try {
        const { assignedTo } = req.query;
        let filter = {};

        if (assignedTo) {
            filter = {
                $or: [
                    { assignedTo },
                    { assignedTechnicianId: assignedTo },
                    { technicianId: assignedTo },
                    { technician: assignedTo }
                ]
            };
        }

        const tickets = await Maintenance.find(filter)
            .populate('assignedTo', 'name email role specialty')
            .populate('assignedTechnicianId', 'name email role specialty')
            .sort({ createdAt: -1 });

        res.json(tickets);

    } catch (err) {
        console.error('Fetch tickets error:', err);
        res.status(500).json({
            message: 'Error fetching tickets: ' + err.message
        });
    }
});

// GET TECHNICIAN'S ASSIGNED TASKS
app.get(
    ['/api/maintenance/assigned/:technicianId', '/api/tickets/assigned/:technicianId'],
    async (req, res) => {
        try {
            const { technicianId } = req.params;

            console.log('Looking for tasks assigned to technician:', technicianId);

            const tickets = await Maintenance.find({
                $or: [
                    { assignedTo: technicianId },
                    { assignedTechnicianId: technicianId },
                    { technicianId: technicianId },
                    { technician: technicianId }
                ]
            })
            .populate('assignedTo', 'name email role specialty')
            .sort({ createdAt: -1 });

            console.log('Assigned tickets found:', tickets.length);
            tickets.forEach((ticket) => {
                console.log(`Ticket ${ticket._id}: Room ${ticket.roomNo || 'N/A'}`);
            });

            res.json(tickets);

        } catch (err) {
            console.error('Assigned tickets error:', err);
            res.status(500).json({
                message: 'Error fetching assigned tickets: ' + err.message
            });
        }
    }
);

// GET ALL TECHNICIANS
app.get('/api/technicians', async (req, res) => {
    try {
        const technicians = await User.find({ role: 'technician' }).select('-password');
        res.json(technicians);
    } catch (err) {
        console.error('Technician fetch error:', err);
        res.status(500).json({
            message: 'Error fetching technicians: ' + err.message
        });
    }
});

// ASSIGN TECHNICIAN
app.put(
    ['/api/maintenance/assign/:ticketId', '/api/tickets/assign/:ticketId'],
    async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { technicianId } = req.body;

            if (!technicianId) {
                return res.status(400).json({ message: 'Technician ID is required.' });
            }

            const technician = await User.findOne({ _id: technicianId, role: 'technician' });
            if (!technician) {
                return res.status(404).json({ message: 'Technician not found.' });
            }

            console.log('Assigning technician:', technician._id.toString(), technician.name);

            const existingTicket = await Maintenance.findById(ticketId);
            if (!existingTicket) {
                return res.status(404).json({ message: 'Ticket not found.' });
            }

            const updatedTicket = await Maintenance.findByIdAndUpdate(
                ticketId,
                {
                    assignedTo: technician._id,
                    assignedTechnicianId: technician._id,
                    technicianId: technician._id,
                    technician: technician._id,
                    technicianName: technician.name,
                    status: 'In Progress'
                },
                { new: true, runValidators: true }
            ).populate('assignedTo', 'name email role specialty');

            res.status(200).json({
                message: 'Technician assigned successfully.',
                ticket: updatedTicket
            });

        } catch (err) {
            console.error('Assign technician error:', err);
            res.status(500).json({
                message: 'Error assigning technician: ' + err.message
            });
        }
    }
);

// UPDATE TICKET / MAINTENANCE
app.put(['/api/tickets/:id', '/api/maintenance/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Protect Room Number
        if (updateData.roomNo !== undefined) {
            updateData.roomNo = String(updateData.roomNo).trim();
        }

        // Technician ID Assignment
        const techIdToSearch = updateData.technicianId || updateData.assignedTo;
        if (techIdToSearch) {
            const technician = await User.findOne({ _id: techIdToSearch, role: 'technician' });
            if (technician) {
                updateData.assignedTo = technician._id;
                updateData.assignedTechnicianId = technician._id;
                updateData.technicianId = technician._id;
                updateData.technician = technician._id;
                updateData.technicianName = technician.name;
            } else if (updateData.technicianId) {
                return res.status(404).json({ message: 'Technician not found.' });
            }
        }

        const updatedTicket = await Maintenance.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTicket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        res.json(updatedTicket);

    } catch (err) {
        console.error('Update ticket error:', err);
        res.status(500).json({
            message: 'Error updating ticket: ' + err.message
        });
    }
});

// UPDATE STATUS
app.put(
    ['/api/maintenance/update-status/:id', '/api/tickets/update-status/:id'],
    async (req, res) => {
        try {
            const { status } = req.body;
            const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Cancelled'];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status.' });
            }

            const updatedTicket = await Maintenance.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true, runValidators: true }
            );

            if (!updatedTicket) {
                return res.status(404).json({ message: 'Ticket not found.' });
            }

            console.log('Ticket status updated:', updatedTicket._id.toString());
            res.json(updatedTicket);

        } catch (err) {
            console.error('Status update error:', err);
            res.status(500).json({
                message: 'Error updating ticket status: ' + err.message
            });
        }
    }
);

// =====================================================
// FRONTEND ROUTING
// =====================================================

app.get('/*splat', (req, res) => {
    // Defaults to login.html if no specific file is requested in the URL
    const requestedFile = req.params.splat || 'login.html';

    res.sendFile(path.join(__dirname, 'public', requestedFile), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'public', 'login.html'));
        }
    });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});