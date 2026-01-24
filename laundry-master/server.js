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

// Simple Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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
        const { status, rider, updatedBy } = req.body;
        
        const index = orders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
            if (status) orders[index].status = status;
            if (rider !== undefined) orders[index].rider = rider;
            orders[index].updatedAt = new Date().toISOString();
            orders[index].updatedBy = updatedBy || 'Staff';
            
            writeData(orders);
            addLog('UPDATE_ORDER', orders[index].updatedBy, `Order ${orderId} updated to ${status}`);
            res.json(orders[index]);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).json({ error: 'Failed' });
    }
});

// --- Settings, Employee and Rider Handlers ---
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const EMPLOYEES_FILE = path.join(__dirname, 'employees.json');
const RIDERS_FILE = path.join(__dirname, 'riders.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');

function readJsonFile(file, defaultValue = []) {
    if (!fs.existsSync(file)) return defaultValue;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJsonFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Activity Logging Helper
function addLog(action, user, details) {
    const logs = readJsonFile(LOGS_FILE);
    logs.push({ timestamp: new Date().toISOString(), action, user, details });
    writeJsonFile(LOGS_FILE, logs.slice(-100)); // Keep last 100 logs
}

// Settings API
app.get('/api/settings', (req, res) => res.json(readJsonFile(SETTINGS_FILE, { 
    phone: '(01) 126 013 34', 
    email: 'support@laundryservice.com',
    whatsapp: '254700000000',
    hours: '8:00 AM - 8:00 PM',
    isOpen: true
})));

app.post('/api/settings', (req, res) => {
    writeJsonFile(SETTINGS_FILE, req.body);
    addLog('UPDATE_SETTINGS', req.body.updatedBy || 'admin', 'Global system settings modified');
    res.json({ message: 'Saved' });
});

// Employee/Staff API
app.get('/api/admin/employees', (req, res) => res.json(getUsers()));
app.get('/api/admin/logs', (req, res) => res.json(readJsonFile(LOGS_FILE)));
app.post('/api/employees/apply', (req, res) => {
    const list = readJsonFile(EMPLOYEES_FILE);
    const application = { ...req.body, id: Date.now(), status: 'Pending', date: new Date().toISOString() };
    list.push(application);
    writeJsonFile(EMPLOYEES_FILE, list);
    res.json({ message: 'Applied successfully' });
});

// Rider API
app.get('/api/admin/riders', (req, res) => res.json(readJsonFile(RIDERS_FILE)));
app.post('/api/admin/riders', (req, res) => {
    const list = readJsonFile(RIDERS_FILE);
    const rider = { ...req.body, id: Date.now() };
    list.push(rider);
    writeJsonFile(RIDERS_FILE, list);
    res.json(rider);
});
app.delete('/api/admin/riders/:id', (req, res) => {
    const list = readJsonFile(RIDERS_FILE);
    const filtered = list.filter(r => r.id != req.params.id);
    writeJsonFile(RIDERS_FILE, filtered);
    res.json({ message: 'Deleted' });
});

// --- User and Auth Handlers ---
const USERS_FILE = path.join(__dirname, 'users.json');

function getUsers() {
    return readJsonFile(USERS_FILE, [
        { username: 'Harry_', password: 'admin123', role: 'admin', name: 'Global Admin' }
    ]);
}

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
    if (user) {
        res.json({ success: true, user: { name: user.name, role: user.role, username: user.username } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials. Use Harry_ / admin123' });
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

app.delete('/api/admin/employees/:username', (req, res) => {
    const users = getUsers();
    const filtered = users.filter(u => u.username !== req.params.username);
    writeJsonFile(USERS_FILE, filtered);
    res.json({ message: 'Staff deleted' });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
    console.log(`Data storage: ${DATA_FILE}`);
});
