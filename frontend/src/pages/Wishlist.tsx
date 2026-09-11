export default function Wishlist() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold">Wishlist</h1>
      <p className="text-gray-500">
        Save bikes you like by tapping the heart icon on a bike's page. This page is scaffolded — wire it up to a
        `wishlist` array on the User model (or a dedicated collection) to persist favorites per user.
      </p>
    </div>
  );
}
