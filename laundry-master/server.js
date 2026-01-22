const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve current directory

// MongoDB Connection
// Connect to local MongoDB instance
mongoose.connect('mongodb://localhost:27017/laundry_service', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Order Schema
const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    name: String,
    phone: String,
    service: String,
    weight: String,
    date: String,
    address: String,
    status: { type: String, default: 'Pending' }, // Pending, Washing, Ironing, Ready, Delivered
    timestamp: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// --- API Routes ---

// 1. Create New Order
app.post('/api/orders', async (req, res) => {
    try {
        console.log('Received Order:', req.body);
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: 'Order created', order: newOrder });
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// 2. Get All Orders (Admin)
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ timestamp: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// 3. Update Order Status
app.put('/api/admin/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            { status: status },
            { new: true }
        );
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// 4. Get Single Order (Tracking)
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({ orderId: orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
