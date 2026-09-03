import React, { type ReactNode, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Sparkles } from 'lucide-react-native';

export const P = {
  bg: '#070812', panel: '#101322', panel2: '#15182B', white: '#F8F7FF',
  muted: '#9698AE', purple: '#8B5CF6', violet: '#6D3BFF', pink: '#FF5DB1',
  cyan: '#43D9FF', mint: '#4DE0B2', gold: '#FFC857', danger: '#FF6B7A',
  line: 'rgba(255,255,255,0.09)',
};

export function AmbientBackground({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(v, { toValue: 1, duration: 4200, useNativeDriver: true }),
    Animated.timing(v, { toValue: 0, duration: 4200, useNativeDriver: true }),
  ])).start(); }, [v]);
  const drift = v.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  return <View style={[styles.root, style]}>
    <LinearGradient colors={['#070812','#0B0A18','#070812']} style={StyleSheet.absoluteFill}/>
    <Animated.View pointerEvents="none" style={[styles.glowA,{transform:[{translateY:drift}]}]}/>
    <Animated.View pointerEvents="none" style={[styles.glowB,{transform:[{translateX:drift}]}]}/>
    <View pointerEvents="none" style={styles.glowC}/>
    {children}
  </View>;
}

export function GlowOrb({ size=140 }: { size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(scale,{toValue:1.08,duration:1800,useNativeDriver:true}),
    Animated.timing(scale,{toValue:1,duration:1800,useNativeDriver:true}),
  ])).start(); }, [scale]);
  return <Animated.View style={[styles.orb,{width:size,height:size,borderRadius:size/2,transform:[{scale}]}]}>
    <LinearGradient colors={[P.cyan,P.violet,P.pink]} style={StyleSheet.absoluteFill}/>
    <View style={[styles.orbCore,{width:size*.56,height:size*.56,borderRadius:size*.28}]}>
      <Sparkles size={28} color={P.white}/>
    </View>
    <View style={styles.orbit}/>
  </Animated.View>;
}

export function GlassCard({children,style,glow=false}:{children:ReactNode;style?:StyleProp<ViewStyle>;glow?:boolean}) {
  return <View style={[styles.cardWrap,glow&&styles.cardGlow,style]}>
    <BlurView intensity={28} tint="dark" style={styles.card}>{children}</BlurView>
  </View>;
}

export function NeonButton({children,onPress,icon,style}:{children:ReactNode;onPress?:()=>void;icon?:ReactNode;style?:StyleProp<ViewStyle>}) {
  const scale=useRef(new Animated.Value(1)).current;
  return <Animated.View style={[{transform:[{scale}]},style]}>
    <Pressable onPress={onPress}
      onPressIn={()=>Animated.spring(scale,{toValue:.97,useNativeDriver:true}).start()}
      onPressOut={()=>Animated.spring(scale,{toValue:1,useNativeDriver:true}).start()}>
      <LinearGradient colors={[P.violet,'#9B45FF',P.pink]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.neon}>
        <Text style={styles.neonText}>{children}</Text>{icon}
      </LinearGradient>
    </Pressable>
  </Animated.View>;
}

export function Reveal({children,delay=0,style}:{children:ReactNode;delay?:number;style?:StyleProp<ViewStyle>}) {
  const opacity=useRef(new Animated.Value(0)).current;
  const y=useRef(new Animated.Value(18)).current;
  useEffect(()=>{Animated.parallel([
    Animated.timing(opacity,{toValue:1,duration:520,delay,useNativeDriver:true}),
    Animated.spring(y,{toValue:0,delay,useNativeDriver:true}),
  ]).start()},[opacity,y,delay]);
  return <Animated.View style={[{opacity,transform:[{translateY:y}]},style]}>{children}</Animated.View>;
}

export function Pill({children,active=false,onPress}:{children:ReactNode;active?:boolean;onPress?:()=>void}) {
  return <Pressable onPress={onPress} style={[styles.pill,active&&styles.pillActive]}>
    <Text style={[styles.pillText,active&&styles.pillTextActive]}>{children}</Text>
  </Pressable>;
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:P.bg},
  glowA:{position:'absolute',width:330,height:330,borderRadius:165,backgroundColor:'#4D20A6',opacity:.22,top:-160,right:-110},
  glowB:{position:'absolute',width:280,height:280,borderRadius:140,backgroundColor:'#0E8DA0',opacity:.1,bottom:80,left:-180},
  glowC:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'#B72676',opacity:.08,top:420,right:-110},
  orb:{alignItems:'center',justifyContent:'center',shadowColor:P.violet,shadowOpacity:.8,shadowRadius:32,elevation:18},
  orbCore:{alignItems:'center',justifyContent:'center',backgroundColor:'rgba(8,8,20,.42)',borderWidth:1,borderColor:'rgba(255,255,255,.3)'},
  orbit:{position:'absolute',width:'112%',height:'42%',borderRadius:100,borderWidth:1,borderColor:'rgba(255,255,255,.45)',transform:[{rotate:'-18deg'}]},
  cardWrap:{borderRadius:24,overflow:'hidden',borderWidth:1,borderColor:P.line,backgroundColor:'rgba(16,19,34,.76)'},
  cardGlow:{shadowColor:P.violet,shadowOpacity:.3,shadowRadius:22,elevation:10},
  card:{padding:16,backgroundColor:'rgba(16,19,34,.74)'},
  neon:{minHeight:56,borderRadius:19,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',shadowColor:P.violet,shadowOpacity:.45,shadowRadius:20,elevation:9},
  neonText:{color:P.white,fontSize:16,fontFamily:'Inter-Bold'},
  pill:{borderWidth:1,borderColor:P.line,backgroundColor:'rgba(255,255,255,.045)',borderRadius:999,paddingHorizontal:14,paddingVertical:9},
  pillActive:{backgroundColor:'rgba(126,75,255,.24)',borderColor:'rgba(151,110,255,.75)'},
  pillText:{color:P.muted,fontSize:12,fontFamily:'Inter-SemiBold'},
  pillTextActive:{color:P.white},
});
