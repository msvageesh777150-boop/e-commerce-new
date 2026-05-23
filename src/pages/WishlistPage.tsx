import React from 'react';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';

interface WishlistPageProps {
  onNavigateTo: (page: string) => void;
}

export default function WishlistPage({ onNavigateTo }: WishlistPageProps) {
  const { wishlist, removeFromWishlist, addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    addToCart(item.id, 1);
    removeFromWishlist(item.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          My Wishlist
        </h1>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-red-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Your wishlist is empty</h3>
            <p className="text-sm text-gray-500 mt-2">Save items you love to your wishlist and review them later.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTo('shop')}
            className="cursor-pointer bg-violet-600 hover:bg-violet-700 transition-colors text-white font-bold py-3 px-8 text-sm rounded-xl shadow-md inline-flex items-center gap-2"
          >
            Browse Shop <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col">
              <div className="aspect-square w-full relative overflow-hidden bg-gray-50">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  type="button"
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-3 right-3 h-8 w-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all cursor-pointer"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{item.name}</h3>
                  <p className="text-lg font-black text-violet-700">₹{item.price.toLocaleString('en-IN')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="mt-4 w-full cursor-pointer bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
