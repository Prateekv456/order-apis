const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '1905', 
  database: 'ecommerce'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database');
});


app.post('/orders', (req, res) => {
  const orderData = req.body;
  const query = `
    INSERT INTO Order_Header (order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id)
    VALUES (?, ?, ?, ?)`;
  
  db.query(query, [orderData.order_date, orderData.customer_id, orderData.shipping_contact_mech_id, orderData.billing_contact_mech_id], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error creating order', error: err });
    }
    const orderId = result.insertId;
    

    orderData.items.forEach(item => {
      const itemQuery = `
        INSERT INTO Order_Item (order_id, product_id, quantity, status)
        VALUES (?, ?, ?, ?)`;
      db.query(itemQuery, [orderId, item.product_id, item.quantity, item.status], (err) => {
        if (err) {
          return res.status(500).send({ message: 'Error adding items to order', error: err });
        }
      });
    });
    res.status(201).send({ message: 'Order created  (Post API Completed)', orderId: orderId });
  });
});


app.get('/orders/:order_id', (req, res) => {
  const orderId = req.params.order_id;
  const query = `
    SELECT * FROM Order_Header 
    JOIN Order_Item ON Order_Header.order_id = Order_Item.order_id
    WHERE Order_Header.order_id = ?`;
  
  db.query(query, [orderId], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error retrieving order', error: err });
    }
    if (result.length === 0) {
      return res.status(404).send({ message: 'Order not found' });
    }
    res.status(200).send(result);
  });
});


app.put('/orders/:order_id', (req, res) => {
  const orderId = req.params.order_id;
  const orderData = req.body;
  const query = `
    UPDATE Order_Header
    SET shipping_contact_mech_id = ?, billing_contact_mech_id = ?
    WHERE order_id = ?`;
  
  db.query(query, [orderData.shipping_contact_mech_id, orderData.billing_contact_mech_id, orderId], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error updating order', error: err });
    }
    res.status(200).send({ message: 'Order updated (PUT API Completed)'  });
  });
});

app.put('/orders/:order_id/items/:order_item_seq_id', (req, res) => {
  const orderId = req.params.order_id;
  const order_item_seq_id = req.params.order_item_seq_id;
  const orderData = req.body;
  const query = `
    UPDATE Order_Item
    SET order_item = ?, quantity = ?, status = ?
    WHERE order_id = ? AND order_item_seq_id = ?`;
  
  db.query(query, [orderData.shipping_contact_mech_id, orderData.billing_contact_mech_id, orderId, orderData.order_item, orderData.quantity, orderData.status, orderData.order_item_seq_id ], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error updating order', error: err });
    }
    res.status(200).send({ message: 'Order updated (PUT API Completed)'  });
  });
});



app.delete('/orders/:order_id', (req, res) => {
  const orderId = req.params.order_id;
  const query = `DELETE FROM Order_Header WHERE order_id = ?`;
  
  db.query(query, [orderId], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error deleting order', error: err });
    }
    res.status(200).send({ message: 'Order deleted (DELETE API Completed)' });
  });
});

app.delete('/orders/:order_id/items/:order_item_seq_id', (req, res) => {
  const orderId = req.params.order_id;
  const orderItemSeqId = req.params.order_item_seq_id;
  
  const query = `DELETE FROM Order_Item WHERE order_id = ? AND order_item_seq_id = ?`;
  
  db.query(query, [orderId, orderItemSeqId], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'Error deleting order item', error: err });
    }
    res.status(200).send({ message: 'Order item deleted (DELETE API Completed)' });
  });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
