import { Tabs } from 'expo-router';
import { Animated, StyleSheet } from 'react-native';
import { House, HeartPulse, MessageCircle, BookOpen, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';
import { P } from '@/components/PremiumUI';

function TabIcon({ icon:Icon, focused }: { icon:any; focused:boolean }) {
  const s=useRef(new Animated.Value(1)).current;
  useEffect(()=>{Animated.spring(s,{toValue:focused?1.13:1,useNativeDriver:true,speed:18,bounciness:8}).start()},[focused,s]);
  return <Animated.View style={{transform:[{scale:s}]}}><Icon size={23} color={focused?P.white:P.muted} strokeWidth={focused?2.7:1.8}/></Animated.View>;
}
export default function TabLayout(){
 return <Tabs screenOptions={{
   headerShown:false, tabBarActiveTintColor:P.white, tabBarInactiveTintColor:P.muted,
   tabBarStyle:styles.bar, tabBarLabelStyle:styles.label, tabBarHideOnKeyboard:true,
   tabBarBackground:()=> <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}/>,
 }}>
  <Tabs.Screen name="index" options={{title:'Home',tabBarIcon:({focused})=><TabIcon icon={House} focused={focused}/>}}/>
  <Tabs.Screen name="mood" options={{title:'Mood',tabBarIcon:({focused})=><TabIcon icon={HeartPulse} focused={focused}/>}}/>
  <Tabs.Screen name="chat" options={{title:'Companion',tabBarIcon:({focused})=><TabIcon icon={MessageCircle} focused={focused}/>}}/>
  <Tabs.Screen name="journal" options={{title:'Journal',tabBarIcon:({focused})=><TabIcon icon={BookOpen} focused={focused}/>}}/>
  <Tabs.Screen name="tools" options={{title:'Tools',tabBarIcon:({focused})=><TabIcon icon={Sparkles} focused={focused}/>}}/>
  <Tabs.Screen name="assessment" options={{href:null}}/><Tabs.Screen name="breathe" options={{href:null}}/><Tabs.Screen name="tips" options={{href:null}}/>
 </Tabs>;
}
const styles=StyleSheet.create({
 bar:{position:'absolute',left:16,right:16,bottom:12,height:70,borderRadius:28,borderTopWidth:1,borderTopColor:P.line,backgroundColor:'rgba(10,11,22,.78)',shadowColor:'#000',shadowOpacity:.45,shadowRadius:24,elevation:18,paddingTop:8,paddingBottom:8},
 label:{fontFamily:'Inter-SemiBold',fontSize:10.5,marginTop:2},
});
