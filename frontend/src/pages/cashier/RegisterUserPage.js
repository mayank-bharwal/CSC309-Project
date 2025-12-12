import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../utils/api';

const RegisterUserPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    utorid: '',
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/users', formData);
      setSuccess(
        `User created successfully! ${
          response.emailSent
            ? 'Activation email sent to ' + formData.email
            : 'User can activate by visiting the login page with their UTORid.'
        }`
      );

      // Reset form
      setFormData({
        utorid: '',
        name: '',
        email: '',
      });

      // Navigate to users list after 3 seconds
      setTimeout(() => {
        navigate('/manager/users');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Register User" description="Create a new user account" />
      <PageBreadcrumb pageTitle="Register User" />

      <ComponentCard
        title="Register New User"
        desc="Create a new user account. The user will receive a reset token to set their password."
      >
        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert type="success" className="mb-4">
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="UTORid"
            name="utorid"
            value={formData.utorid}
            onChange={handleChange}
            placeholder="Enter UTORid (max 8 characters)"
            required
            maxLength={8}
            pattern="^[a-zA-Z][a-zA-Z0-9]*$"
            helperText="Must start with a letter and contain only letters and numbers"
          />

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            required
            maxLength={50}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@mail.utoronto.ca"
            required
            pattern="^[a-zA-Z0-9._%+-]+@mail\.utoronto\.ca$"
            helperText="Must be a valid UofT email address"
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/manager/users')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
};

export default RegisterUserPage;
