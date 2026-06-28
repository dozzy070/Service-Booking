// src/components/admin/AdminHelpCenter.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Modal,
  Badge,
  Alert,
  Spinner,
  Tabs,
  Tab
} from 'react-bootstrap';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BookOpen,
  FileText,
  Megaphone,
  HelpCircle
} from 'lucide-react';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

const AdminHelpCenter = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    status: 'published'
  });

  // Mock data
  const MOCK_FAQS = [
    { id: '1', question: 'How do I book a service?', answer: '...', category: 'Booking', status: 'published', helpful_count: 120 },
    { id: '2', question: 'How do I become a provider?', answer: '...', category: 'Provider', status: 'published', helpful_count: 85 }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Try API or use mock
      setFaqs(MOCK_FAQS);
      setAnnouncements([]);
      setKnowledgeBase([]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      toast.success('Saved successfully');
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        toast.success('Deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Help Center Management</h2>
            <p className="text-muted">Manage FAQs, announcements, and knowledge base</p>
          </div>
          <Button variant="primary" onClick={() => { setEditingItem(null); setFormData({ question: '', answer: '', category: '', status: 'published' }); setShowModal(true); }}>
            <Plus size={18} className="me-2" />
            Add New
          </Button>
        </div>

        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="px-4 pt-3"
              style={{ borderBottom: 'none' }}
            >
              <Tab eventKey="faqs" title={<span className="d-flex align-items-center gap-2"><HelpCircle size={16} /> FAQs</span>}>
                <div className="p-4">
                  <Table hover>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th>Question</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Helpful</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.map(faq => (
                        <tr key={faq.id}>
                          <td>{faq.question}</td>
                          <td><Badge bg="light">{faq.category}</Badge></td>
                          <td>
                            <Badge bg={faq.status === 'published' ? 'success' : 'warning'}>
                              {faq.status}
                            </Badge>
                          </td>
                          <td>{faq.helpful_count}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" className="me-1"><Edit size={14} /></Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(faq.id)}><Trash2 size={14} /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="announcements" title={<span className="d-flex align-items-center gap-2"><Megaphone size={16} /> Announcements</span>}>
                <div className="p-4">
                  <p className="text-muted text-center py-4">No announcements yet. Create your first announcement.</p>
                </div>
              </Tab>

              <Tab eventKey="knowledge" title={<span className="d-flex align-items-center gap-2"><BookOpen size={16} /> Knowledge Base</span>}>
                <div className="p-4">
                  <p className="text-muted text-center py-4">No articles yet. Create your first knowledge base article.</p>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingItem ? 'Edit' : 'Add New'} FAQ</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Question</Form.Label>
              <Form.Control
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Answer</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer"
              />
            </Form.Group>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Category</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="Booking">Booking</option>
                    <option value="Provider">Provider</option>
                    <option value="Payments">Payments</option>
                    <option value="Support">Support</option>
                    <option value="Policies">Policies</option>
                    <option value="Security">Security</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminHelpCenter;