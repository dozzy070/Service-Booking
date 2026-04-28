// src/pages/provider/ProviderEarnings.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button } from 'react-bootstrap';
import { FaDownload, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast';

const ProviderEarnings = () => {
  const [earnings, setEarnings] = useState({ total: 0, available: 0, pending: 0, transactions: [] });

  useEffect(() => {
    fetchEarnings();
    const interval = setInterval(fetchEarnings, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/provider/earnings');
      setEarnings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdraw = async () => {
    try {
      await api.post('/provider/withdraw');
      toast.success('Withdrawal request submitted');
      fetchEarnings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Earnings Overview</h2>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4>Total Earnings</h4>
              <h2 className="text-primary">${earnings.total.toLocaleString()}</h2>
            </div>
            <div>
              <Button variant="success" onClick={handleWithdraw}>
                <FaMoneyBillWave className="me-2" /> Withdraw Available (${earnings.available})
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Transaction History</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {earnings.transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>{tx.description}</td>
                  <td className="fw-bold">${tx.amount}</td>
                  <td><Badge bg={tx.status === 'completed' ? 'success' : 'warning'}>{tx.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProviderEarnings;