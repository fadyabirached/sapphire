import { Provider as PaperProvider } from 'react-native-paper'; // 1. IMPORT THE PROVIDER
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import {
  TouchableOpacity,
  View,
  Share,
  Image,
} from 'react-native';

// Screens
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import UploadScreen from './screens/UploadScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import MarketplaceScreen from './screens/MarketPlaceScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';

// -------------------------
// Custom Drawer Content
// -------------------------
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      {/* Replace Ionicons diamond with your PNG logo */}
      <View style={{ alignItems: 'center', padding: 20 }}>
        {/* Adjust the path to SapphireFYPlogo.png as needed */}
        <Image
          source={require('./assets/SapphireFYPlogo.png')}
          style={{ width: 80, height: 80 }}
          resizeMode="contain"
        />
      </View>

      {/* Render the rest of the drawer items */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function EmptyScreen() {
  return null;
}

/* ------------------------
   Inline TOS Stack
------------------------- */
function TOSStack() {
  const TStack = createStackNavigator();
  return (
    <TStack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#F4F1FA',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#2C4F83',
        },
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={24} color="#2C4F83" />
          </TouchableOpacity>
        ),
      })}
    >
      <TStack.Screen
        name="TermsOfServiceScreen"
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service' }}
      />
    </TStack.Navigator>
  );
}

/* ------------------------
   Inline Privacy Policy Stack
------------------------- */
function PrivacyPolicyStack() {
  const PStack = createStackNavigator();
  return (
    <PStack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#F4F1FA',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#2C4F83',
        },
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={24} color="#2C4F83" />
          </TouchableOpacity>
        ),
      })}
    >
      <PStack.Screen
        name="PrivacyPolicyScreen"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy' }}
      />
    </PStack.Navigator>
  );
}

/* ------------------------
   Bottom Tab Navigator
------------------------- */
function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Sapphire AI') {
            iconName = focused ? 'diamond' : 'diamond-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2C4F83',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#F4F1FA',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
          paddingBottom: 5,
          paddingTop: 5,
          // Without an explicit height, react-navigation's web default is too
          // short to fit both the icon and its label, so the label gets
          // flex-shrunk to ~1px and clipped by overflow:hidden — the tab bar
          // silently loses its text on web even though native has room for it.
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#F4F1FA',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#2C4F83',
        },
        headerTitleAlign: 'left',

        // Hamburger in the header for each tab screen
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={24} color="#2C4F83" />
          </TouchableOpacity>
        ),
        // Icons on the right (store & settings)
        headerRight: () => (
          <View style={{ flexDirection: 'row', paddingRight: 16 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Marketplace')}
              style={{ marginRight: 16 }}
            >
              <FontAwesome5 name="store" size={24} color="#2C4F83" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings" size={24} color="#2C4F83" />
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Sapphire AI" component={ChatbotScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

/* ------------------------
   Drawer Navigator
------------------------- */
function DrawerNavigator() {
  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Download Sapphire app from the App Store or Google Play',
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Drawer.Navigator
      // Use our custom drawer content:
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#fff',
          width: 250,
        },
        drawerActiveTintColor: '#2C4F83',
      }}
    >
      <Drawer.Screen
        name="HomeTabs"
        component={TabNavigator}
        options={{ title: 'Sapphire' }}
      />
      <Drawer.Screen
        name="TOSStack"
        component={TOSStack}
        options={{ title: 'Terms of Service' }}
      />
      <Drawer.Screen
        name="PrivacyPolicyStack"
        component={PrivacyPolicyStack}
        options={{ title: 'Privacy Policy' }}
      />
      <Drawer.Screen
        name="ShareLink"
        component={EmptyScreen}
        options={{ title: 'Share' }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            handleShare();
          },
        }}
      />
    </Drawer.Navigator>
  );
}

/* ------------------------
   Main App Stack
------------------------- */
export default function App() {
  return (
    // 2. WRAP YOUR ENTIRE APP WITH THE PROVIDER
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SignIn"
          screenOptions={{
            headerBackTitleVisible: false,
            headerTruncatedBackTitle: '',
          }}
        >
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="MainDrawer"
            component={DrawerNavigator}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Marketplace"
            component={MarketplaceScreen}
            options={{
              headerStyle: {
                backgroundColor: '#F4F1FA',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 5,
              },
              headerTitleStyle: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#2C4F83',
              },
              headerTitleAlign: 'center',
              headerBackImage: () => (
                <Ionicons name="chevron-back" size={24} color="#2C4F83" />
              ),
              headerBackTitle: '',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerStyle: {
                backgroundColor: '#F4F1FA',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 5,
              },
              headerTitleStyle: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#2C4F83',
              },
              headerTitleAlign: 'center',
              headerBackImage: () => (
                <Ionicons name="chevron-back" size={24} color="#2C4F83" />
              ),
              headerBackTitle: '',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}