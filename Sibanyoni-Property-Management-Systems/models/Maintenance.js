const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
    {
        // ==========================================
        // TENANT INFORMATION
        // ==========================================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        tenantName: {
            type: String,
            trim: true
        },

        tenantEmail: {
            type: String,
            trim: true,
            lowercase: true
        },

        // ==========================================
        // ROOM NUMBER
        // ==========================================

        roomNo: {
            type: String,
            required: true,
            trim: true
        },

        // ==========================================
        // MAINTENANCE DETAILS
        // ==========================================

        title: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            enum: [
                'Plumbing',
                'Electrical',
                'Appliance',
                'Structural',
                'Other'
            ],
            default: 'Other'
        },

        priority: {
            type: String,
            enum: [
                'Low',
                'Medium',
                'High',
                'Emergency'
            ],
            default: 'Medium'
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        // ==========================================
        // TICKET STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                'Pending',
                'In Progress',
                'Resolved',
                'Cancelled'
            ],
            default: 'Pending'
        },

        // ==========================================
        // TECHNICIAN ASSIGNMENT
        // ==========================================

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        assignedTechnicianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        technicianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        technicianName: {
            type: String,
            trim: true,
            default: ''
        }
    },

    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        'Maintenance',
        maintenanceSchema
    );