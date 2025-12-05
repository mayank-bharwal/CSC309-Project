import { Helmet } from 'react-helmet-async';

const PageMeta = ({ title, description }) => (
  <Helmet>
    <title>{title} | Loyalty Program</title>
    <meta name="description" content={description} />
  </Helmet>
);

export default PageMeta;

