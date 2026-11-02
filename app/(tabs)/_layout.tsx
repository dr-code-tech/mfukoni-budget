import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { BudgetStoreProvider } from "@/hooks/use-budget-store";
import { palette, typeface } from "@/lib/budget-theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <BudgetStoreProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: palette.mint,
          tabBarInactiveTintColor: palette.dim,
          tabBarLabelStyle: { fontFamily: typeface.medium, fontSize: 10, marginTop: 1 },
          tabBarStyle: {
            height: 59 + bottomPadding,
            paddingTop: 8,
            paddingBottom: bottomPadding,
            backgroundColor: palette.surface,
            borderTopColor: palette.line,
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Activity",
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "swap-horizontal" : "swap-horizontal-outline"} size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: "Budgets",
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "pie-chart" : "pie-chart-outline"} size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="data"
          options={{
            title: "Data",
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "document-text" : "document-text-outline"} size={20} color={color} />,
          }}
        />
      </Tabs>
    </BudgetStoreProvider>
  );
}
