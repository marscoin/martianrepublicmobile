import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, I18nManager, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BlueStorageContext } from '../../blue_modules/storage-context';
import { AbstractWallet } from '../../class';
import Button from '../../components/Button';
import SafeArea from '../../components/SafeArea';
import { useTheme } from '../../components/themes';
import usePrivacy from '../../hooks/usePrivacy';
import loc from '../../loc';

const PleaseBackupCivic: React.FC = () => {
  const { wallets } = useContext(BlueStorageContext);
  const [isLoading, setIsLoading] = useState(true);
  const { walletID } = useRoute().params as { walletID: string };
  const wallet = wallets.find((w: AbstractWallet) => w.getID() === walletID);
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { enableBlur, disableBlur } = usePrivacy();

  const stylesHook = StyleSheet.create({
    flex: {
      backgroundColor: colors.elevated,
    },
    word: {
      backgroundColor: colors.inputBackgroundColor,
    },
    wortText: {
      color: colors.labelText,
      fontFamily: 'Orbitron-Regular',
      letterSpacing: 1.1
    },
    pleaseText: {
      color: colors.foregroundColor,
      fontFamily: 'Orbitron-Regular',
      letterSpacing: 1.1
    },
  });

  const handleBackButton = useCallback(() => {
    // @ts-ignore: Ignore
    //navigation.getParent()?.pop();
    console.log('I WROTE IT DOWN PRESSED')
    wallet.setCivic()
    //console.log(wallet)
    navigation.navigate('MainApp')
    return true;
  }, [navigation]);

  useEffect(() => {
    enableBlur();
    setIsLoading(false);
    BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => {
      disableBlur();
      BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderSecret = () => {
    const component: JSX.Element[] = [];
    const entries = wallet?.getSecret().split(/\s/).entries();
    if (entries) {
      for (const [index, secret] of entries) {
        if (secret) {
          const text = `${index + 1}. ${secret}  `;
          component.push(
            <View style={[styles.word, stylesHook.word]} key={index}>
              <Text style={[styles.wortText, stylesHook.wortText]} textBreakStrategy="simple">
                {text}
              </Text>
            </View>,
          );
        }
      }
    }
    return component;
  };

  return (
    <SafeArea style={[isLoading ? styles.loading : {}, stylesHook.flex]}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <ScrollView contentContainerStyle={styles.flex} testID="PleaseBackupScrollView">
          <View style={styles.please}>
            <Text style={[styles.pleaseText, stylesHook.pleaseText]}>
              Please take a moment to write down this secret phrase on a piece of paper.
              It is your backup for CIVIC WALLET. 
            </Text>
            <Text style={[styles.infoText]}>
              CIVIC WALLET is your proof if citizenship and the only way to access your MCR account! 
            </Text>
          </View>
          <View style={styles.list}>
            <View style={styles.secret}>{renderSecret()}</View>
          </View>
          
          <View style={styles.bottom}>
            <Button testID="PleasebackupOk" onPress={handleBackButton} title={loc.pleasebackup.ok} />
          </View>
        </ScrollView>
      )}
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    justifyContent: 'space-around',
  },
  word: {
    marginRight: 8,
    marginBottom: 8,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 4,
  },
  wortText: {
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 17,
  },
  please: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  list: {
    flexGrow: 2,
    paddingHorizontal: 16,
  },
  bottom: {
    flexGrow: 2,
    alignItems: 'center',

  },
  pleaseText: {
    marginVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign:'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  infoText: {
    marginHorizontal: 20,
    fontSize: 16,
    fontWeight:'500',
    fontFamily: 'Orbitron-SemiBold',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
    color: 'red', 
    textAlign:'center'
  },
  secret: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 14,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
});

export default PleaseBackupCivic;
