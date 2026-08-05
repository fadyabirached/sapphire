import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

const localImages = {
  'foamroller.png': require('../assets/foamroller.png'),
  'gymbag.jpg': require('../assets/gymbag.jpg'),
  'handgrip.jpg': require('../assets/handgrip.jpg'),
  'parallettes.png': require('../assets/paralettes.png'),
  'resistancebands.png': require('../assets/resistancebands.png'),
  'rope.jpg': require('../assets/rope.jpg'),
  'weightvest.jpg': require('../assets/weightvest.jpg'),
};

export default function MarketPlaceScreen() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  // UI states
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartVisible, setCartVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [address, setAddress] = useState('');

  // Refresh toggle (to trigger re-render if needed)
  const [refresh, setRefresh] = useState(false);

  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchProducts();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---------------------------
  // GET /products
  // ---------------------------
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return;
      }
      const response = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (response.ok) {
        setProducts(data);
      } else {
        console.log('Error fetchProducts:', data.error);
      }
    } catch (error) {
      console.log('Network error in fetchProducts:', error);
    }
  };

  // ---------------------------
  // GET /cart
  // ---------------------------
  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cartItems || []);
      } else {
        console.log('Error fetchCart:', data.error);
      }
    } catch (error) {
      console.log('Network error fetchCart:', error);
    }
  };

  // ---------------------------
  // POST /cart (Add item)
  // ---------------------------
  const handleAddToCart = async () => {
    if (!selectedItem) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/cart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedItem.Product_ID,
          quantity,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetchCart();
      } else {
        console.log('Error adding to cart:', data.error);
      }
    } catch (error) {
      console.log('Network error handleAddToCart:', error);
    }
    setSelectedItem(null);
    setQuantity(1);
  };

  // ---------------------------
  // POST /checkout
  // ---------------------------
  const handleCheckout = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'No auth token found.');
        return;
      }
      if (!address.trim()) {
        Alert.alert('Error', 'Please enter a shipping address.');
        return;
      }

      const response = await fetch(`${BASE_URL}/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();

      if (response.ok) {
        // Refresh states
        setCartItems([]);
        setAddress('');
        setCartVisible(false);
        await fetchProducts();         // to refresh stock
        await fetchPurchaseHistory();  // to refresh history
        setRefresh(!refresh);

        Alert.alert('Success', `Checkout successful! Total: $${data.total}`);
      } else {
        Alert.alert('Checkout failed', data.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Checkout failed', 'Please try again.');
    }
  };

  // ---------------------------
  // GET /purchases
  // ---------------------------
  const fetchPurchaseHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        // data.orders => array of { orderId, date, address, total, items: [...] }
        setPurchaseHistory(data.orders || []);
      } else {
        console.log('Error fetchPurchaseHistory:', data.error);
      }
    } catch (error) {
      console.log('Network error fetchPurchaseHistory:', error);
    }
  };

  // ============= RENDER PRODUCT ITEM ============= //
  const renderItem = ({ item }) => {
    const localImage = localImages[item.ProductImageURL]
      ? localImages[item.ProductImageURL]
      : require('../assets/icon.png');

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          setSelectedItem(item);
          setQuantity(1);
        }}
      >
        <Image source={localImage} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.Title}</Text>
          <Text style={styles.itemPrice}>${Number(item.Price || 0).toFixed(2)}</Text>
          <Text style={styles.itemPrice}>In Stock: {item.StockQuantity}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ============= RENDER PURCHASE HISTORY ITEM ============= //
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyHeader}>
        Order #{item.orderId} - {item.date}
      </Text>
      <Text>Address: {item.address}</Text>
      {item.items.map((product, idx) => (
        <Text key={idx}>
          {product.title} x{product.quantity} - $
          {(product.price * product.quantity).toFixed(2)}
        </Text>
      ))}
      <Text style={styles.historyTotal}>Total: ${item.total}</Text>
    </View>
  );

  // ============= MAIN RETURN ============= //
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with icons */}
      <View style={styles.header}>
        {/* History icon */}
        <TouchableOpacity
          onPress={async () => {
            await fetchPurchaseHistory();
            setHistoryVisible(true);
          }}
          style={{ marginRight: 20 }}
        >
          <Ionicons name="time-outline" size={24} color="#2C4F83" />
        </TouchableOpacity>
        {/* Cart icon */}
        <TouchableOpacity
          onPress={async () => {
            await fetchCart();
            setCartVisible(true);
          }}
        >
          <Ionicons name="cart-outline" size={24} color="#2C4F83" />
        </TouchableOpacity>
      </View>

      {/* Product list */}
      <FlatList
        data={products}
        keyExtractor={(prod) => String(prod.Product_ID)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        extraData={refresh}
      />

      {/* ITEM DETAIL MODAL */}
      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            {selectedItem && (
              <>
                <Image
                  source={
                    localImages[selectedItem.ProductImageURL]
                      ? localImages[selectedItem.ProductImageURL]
                      : require('../assets/icon.png')
                  }
                  style={styles.modalImage}
                />
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedItem.Title}</Text>
                  <Text style={styles.modalPrice}>
                    Price: ${Number(selectedItem.Price || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.modalPrice}>
                    In Stock: {selectedItem.StockQuantity}
                  </Text>
                  <Text style={styles.modalDescription}>
                    {selectedItem.Description}
                  </Text>

                  {selectedItem.StockQuantity > 0 ? (
                    <View style={styles.quantityContainer}>
                      <Text style={styles.quantityLabel}>Quantity:</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          onPress={() => setQuantity(Math.max(1, quantity - 1))}
                          style={styles.quantityButton}
                        >
                          <Ionicons name="remove" size={20} color="#2C4F83" />
                        </TouchableOpacity>
                        <Text style={styles.quantityNumber}>{quantity}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (quantity < selectedItem.StockQuantity) {
                              setQuantity(quantity + 1);
                            }
                          }}
                          style={styles.quantityButton}
                        >
                          <Ionicons name="add" size={20} color="#2C4F83" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.outOfStock}>Out of Stock</Text>
                  )}

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.buyButton,
                        selectedItem.StockQuantity === 0 && { backgroundColor: '#ccc' },
                      ]}
                      onPress={handleAddToCart}
                      disabled={selectedItem.StockQuantity === 0}
                    >
                      <Text style={styles.buyButtonText}>
                        {selectedItem.StockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setSelectedItem(null)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CART MODAL */}
      <Modal visible={cartVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.cartContainer}>
            <Text style={styles.modalTitle}>Your Cart</Text>
            {cartItems.length === 0 ? (
              <Text style={styles.emptyText}>Your cart is empty</Text>
            ) : (
              <>
                {cartItems.map((ci) => {
                  const lineCost = ci.price * ci.quantity;
                  return (
                    <View key={ci.productId} style={styles.cartItem}>
                      <Text style={styles.cartItemText}>
                        {ci.title} x {ci.quantity} (${lineCost.toFixed(2)})
                      </Text>
                    </View>
                  );
                })}
                <Text style={styles.cartItemText}>
                  Total: $
                  {cartItems
                    .reduce((sum, ci) => sum + ci.price * ci.quantity, 0)
                    .toFixed(2)}
                </Text>
              </>
            )}

            <Text style={styles.addressLabel}>Shipping Address:</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.buyButton,
                  (cartItems.length === 0 || !address.trim()) && { backgroundColor: '#ccc' },
                ]}
                onPress={handleCheckout}
                disabled={cartItems.length === 0 || !address.trim()}
              >
                <Text style={styles.buyButtonText}>Checkout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCartVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PURCHASE HISTORY MODAL */}
      <Modal visible={historyVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.historyContainer}>
            <Text style={styles.modalTitle}>Purchase History</Text>

            <FlatList
              data={purchaseHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.orderId.toString()}
              contentContainerStyle={styles.historyList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No purchases yet.</Text>
              }
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setHistoryVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ================== STYLES ================== //
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '48%',
    marginBottom: 15,
    // For web shadow, but optional on mobile
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  itemDetails: {
    padding: 12,
    paddingBottom: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C4F83',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#666',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C4F83',
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#f0f4f7',
    borderRadius: 15,
    padding: 8,
    marginHorizontal: 5,
  },
  quantityNumber: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 5,
  },
  outOfStock: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  buyButton: {
    backgroundColor: '#2C4F83',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginRight: 5,
  },
  buyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#2C4F83',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginLeft: 5,
  },
  cancelButtonText: {
    color: '#2C4F83',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Cart
  cartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartItemText: {
    fontSize: 16,
    color: '#333',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C4F83',
    marginTop: 10,
  },
  addressInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
    marginBottom: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },
  // Purchase history
  historyContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
  },
  historyHeader: {
    fontWeight: 'bold',
    color: '#2C4F83',
    marginBottom: 5,
  },
  historyTotal: {
    fontWeight: 'bold',
    marginTop: 5,
    color: 'green',
  },
});
