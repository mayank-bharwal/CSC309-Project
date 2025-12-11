import ComponentCard from "../../components/common/ComponentCard";

const CashierDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
        <h1 className="text-2xl font-semibold mb-1">
          Welcome back!
        </h1>
        <p className="text-sm opacity-90">
          You are logged in as a Cashier
        </p>
      </div>

      {/* Info Card */}
      <ComponentCard title="Cashier Dashboard">
        <p className="text-gray-700 dark:text-gray-300">
          Use the menu to create transactions and process redemption requests.
        </p>
      </ComponentCard>
    </div>
  );
};

export default CashierDashboard;