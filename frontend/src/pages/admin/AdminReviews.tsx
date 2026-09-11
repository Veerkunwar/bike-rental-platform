export default function AdminReviews() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reviews</h1>
      <div className="card p-8 text-center text-gray-500">
        Reviews are visible on each bike's public page. Add a moderation table here (list all Review docs via a
        new GET /api/admin/reviews endpoint) if you need to hide/delete inappropriate reviews.
      </div>
    </div>
  );
}
