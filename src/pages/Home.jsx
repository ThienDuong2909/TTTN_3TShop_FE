import CategoryList from '../features/products/components/CategoryList';
import ProductList from '../features/products/components/ProductList';

const Home = () => {
  return (
    <div className="space-y-6 px-4">
      <CategoryList />
      <ProductList />
    </div>
  );
};

export default Home;
