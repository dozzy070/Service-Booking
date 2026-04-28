import React, { useState } from 'react';
import {
  Card,
  Form,
  Button,
  Badge,
  Row,
  Col
} from 'react-bootstrap';
import { FaFilter, FaTimes } from 'react-icons/fa';

const ServiceFilter = ({ categories, onApply, onClear, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    location: initialFilters.location || '',
    rating: initialFilters.rating || '',
    sort: initialFilters.sort || 'newest'
  });

  const [expanded, setExpanded] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      rating: '',
      sort: 'newest'
    });
    onClear();
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'newest').length;

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header 
        className="bg-white py-3 d-flex justify-content-between align-items-center"
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <h6 className="mb-0 d-flex align-items-center">
          <FaFilter className="me-2 text-primary" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge bg="primary" className="ms-2">{activeFiltersCount}</Badge>
          )}
        </h6>
        <Button variant="link" size="sm" className="p-0">
          {expanded ? '−' : '+'}
        </Button>
      </Card.Header>

      {expanded && (
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Category</Form.Label>
            <Form.Select
              name="category"
              value={filters.category}
              onChange={handleChange}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Price Range</Form.Label>
            <Row>
              <Col xs={6}>
                <Form.Control
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={handleChange}
                  min="0"
                />
              </Col>
              <Col xs={6}>
                <Form.Control
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  min="0"
                />
              </Col>
            </Row>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Location</Form.Label>
            <Form.Control
              type="text"
              name="location"
              placeholder="City or ZIP"
              value={filters.location}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Sort By</Form.Label>
            <Form.Select
              name="sort"
              value={filters.sort}
              onChange={handleChange}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </Form.Select>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button variant="primary" onClick={handleApply}>
              Apply Filters
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="outline-secondary" onClick={handleClear}>
                <FaTimes className="me-2" /> Clear All
              </Button>
            )}
          </div>
        </Card.Body>
      )}
    </Card>
  );
};

export default ServiceFilter;