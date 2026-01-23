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
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Error in readData:', err);
        return [];
    }
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
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
    }
});

// 3. Update Order Status
app.put('/api/admin/orders/:id', (req, res) => {
    try {
        const orders = readData();
        const orderId = req.params.id;
        const { status, rider } = req.body;
        
        const index = orders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
            if (status) orders[index].status = status;
            if (rider !== undefined) orders[index].rider = rider;
            writeData(orders);
            res.json(orders[index]);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// --- Settings and Employee Handlers ---
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const EMPLOYEES_FILE = path.join(__dirname, 'employees.json');

function readJsonFile(file, defaultValue = []) {
    if (!fs.existsSync(file)) return defaultValue;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJsonFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Settings API
app.get('/api/settings', (req, res) => res.json(readJsonFile(SETTINGS_FILE, { phone: '(01) 126 013 34', email: 'support@laundryservice.com' })));
app.post('/api/settings', (req, res) => {
    writeJsonFile(SETTINGS_FILE, req.body);
    res.json({ message: 'Saved' });
});

// Employee API
app.get('/api/admin/employees', (req, res) => res.json(readJsonFile(EMPLOYEES_FILE)));
app.post('/api/employees/apply', (req, res) => {
    const list = readJsonFile(EMPLOYEES_FILE);
    const application = { ...req.body, id: Date.now(), status: 'Pending', date: new Date().toISOString() };
    list.push(application);
    writeJsonFile(EMPLOYEES_FILE, list);
    res.json({ message: 'Applied successfully' });
});

// --- User and Auth Handlers ---
const USERS_FILE = path.join(__dirname, 'users.json');

function getUsers() {
    return readJsonFile(USERS_FILE, [
        { email: 'admin@laundry.com', password: 'admin123', role: 'admin', name: 'Global Admin' }
    ]);
}

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ success: true, user: { name: user.name, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials. Use admin@laundry.com / admin123' });
    }
});

// Admin Registering Employee
app.post('/api/admin/employees/register', (req, res) => {
    const users = getUsers();
    const newUser = { ...req.body, role: 'employee', status: 'Active' };
    users.push(newUser);
    writeJsonFile(USERS_FILE, users);
    res.json({ message: 'Employee registered successfully' });
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
