const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'orders.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Helper: Read Data
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

// Helper: Write Data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- API Routes ---

// 1. Create New Order
app.post('/api/orders', (req, res) => {
    try {
        const orders = readData();
        const newOrder = req.body;
        
        // Ensure critical fields
        if (!newOrder.orderId) {
            newOrder.orderId = 'T-' + Math.floor(10000 + Math.random() * 90000);
        }
        if (!newOrder.timestamp) {
            newOrder.timestamp = new Date().toISOString();
        }
        if (!newOrder.status) {
            newOrder.status = 'Pending';
        }

        orders.push(newOrder);
        writeData(orders);
        
        console.log('Order Saved:', newOrder.orderId);
        res.status(201).json({ message: 'Order created', order: newOrder });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// 2. Get All Orders (Admin)
app.get('/api/admin/orders', (req, res) => {
    try {
        const orders = readData();
        // Sort by timestamp desc
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// 3. Update Order Status
app.put('/api/admin/orders/:id', (req, res) => {
    try {
        const orders = readData();
        const orderId = req.params.id;
        const { status } = req.body;
        
        const index = orders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
            orders[index].status = status;
            writeData(orders);
            res.json(orders[index]);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// 4. Get Single Order (Tracking)
app.get('/api/orders/:id', (req, res) => {
    try {
        const orders = readData();
        const orderId = req.params.id;
        const order = orders.find(o => o.orderId === orderId);
        
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Data storage: ${DATA_FILE}`);
});
