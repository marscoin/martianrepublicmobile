import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { ActivityIndicator, FlatList, LayoutAnimation, StyleSheet, View } from 'react-native';
import IdleTimerManager from 'react-native-idle-timer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlueButtonLink, BlueFormLabel, BlueSpacing10, BlueSpacing20 } from '../../BlueComponents';
import navigationStyle from '../../components/navigationStyle';
import WalletToImport from '../../components/WalletToImport';
import loc from '../../loc';
import { HDSegwitBech32Wallet } from '../../class';
import startImport from '../../class/wallet-import';
import { BlueStorageContext } from '../../blue_modules/storage-context';
import prompt from '../../helpers/prompt';
import { useTheme } from '../../components/themes';
import Button from '../../components/Button';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../blue_modules/hapticFeedback';
import SafeArea from '../../components/SafeArea';
import presentAlert from '../../components/Alert';

const ImportCivicWalletDiscovery = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const route = useRoute();
  const { importText, askPassphrase, searchAccounts } = route.params;
  const task = useRef();
  const { addAndSaveCivicWallet } = useContext(BlueStorageContext);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [password, setPassword] = useState();
  const [selected, setSelected] = useState(0);
  const [progress, setProgress] = useState();
  const importing = useRef(false);
  const bip39 = useMemo(() => {
    const hd = new HDSegwitBech32Wallet();
    hd.setSecret(importText);
    return hd.validateMnemonic();
  }, [importText]);

  const stylesHook = StyleSheet.create({
    root: {
      backgroundColor: colors.elevated,
    },
    center: {
      backgroundColor: colors.elevated,
    },
  });

  const saveWallet = wallet => {
    if (importing.current) return;
    importing.current = true;
    addAndSaveCivicWallet(wallet);
    navigation.navigate('MainApp')
  };

  useEffect(() => {
    const onProgress = data => setProgress(data);

    const onWallet = wallet => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const id = wallet.getID();
      let subtitle;
      try {
        subtitle = wallet.getDerivationPath?.();
      } catch (e) {}
      setWallets(w => [...w, { wallet, subtitle, id }]);
    };

    const onPassword = async (title, subtitle) => {
      try {
        const pass = await prompt(title, subtitle);
        setPassword(pass);
        return pass;
      } catch (e) {
        if (e.message === 'Cancel Pressed') {
          navigation.goBack();
        }
        throw e;
      }
    };

    IdleTimerManager.setIdleTimerDisabled(true);

    task.current = startImport(importText, askPassphrase, searchAccounts, onProgress, onWallet, onPassword);

    task.current.promise
      .then(({ cancelled, wallets: w }) => {
        if (cancelled) return;
        if (w.length === 1) saveWallet(w[0]); // instantly save wallet if only one has been discovered
        if (w.length === 0) {
          triggerHapticFeedback(HapticFeedbackTypes.ImpactLight);
        }
      })
      .catch(e => {
        console.warn('import error', e);
        //presentAlert({ title: 'Import error', message: e.message });
      })
      .finally(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLoading(false);
        IdleTimerManager.setIdleTimerDisabled(false);
      });

    return () => task.current.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const handleCustomDerivation = () => {
  //   task.current.stop();
  //   navigation.navigate('ImportCustomDerivationPath', { importText, password });
  // };

  const renderItem = ({ item, index }) => (
    <WalletToImport
      key={item.id}
      title={item.wallet.typeReadable}
      subtitle={item.subtitle}
      active={selected === index}
      onPress={() => {
        setSelected(index);
        triggerHapticFeedback(HapticFeedbackTypes.Selection);
      }}
    />
  );

  const keyExtractor = w => w.id;

  return (
    <SafeArea style={[styles.root, stylesHook.root]}>
      {/* <BlueSpacing20 /> */}
      <View>
        <BlueFormLabel>{loc.wallets.import_discovery_subtitle}</BlueFormLabel>
        <BlueSpacing20 />
      </View>

      {!loading && wallets.length === 0 ? (
        <View style={styles.noWallets}>
          <ActivityIndicator size={'large'} testID="Loading" />
          <BlueFormLabel>{loc.wallets.import_discovery_no_wallets}</BlueFormLabel>
        </View>
      ) : (
        <View>
          <FlatList contentContainerStyle={styles.flatListContainer} data={wallets} keyExtractor={keyExtractor} renderItem={renderItem} />
        </View>
      )}

      <View style={[styles.center, stylesHook.center]}>
        {loading && (
          <>
            {/* <BlueSpacing10 /> */}
            <ActivityIndicator size={'large'} testID="Loading" />
            <BlueSpacing10 />
            <BlueFormLabel>{progress}</BlueFormLabel>
            <BlueSpacing10 />
          </>
        )}
        {/* {bip39 && (
          <BlueButtonLink
            title={loc.wallets.import_discovery_derivation}
            testID="CustomDerivationPathButton"
            onPress={handleCustomDerivation}
          />
        )} */}
        <BlueSpacing10 />
        <View style={styles.buttonContainer}>
          <Button
            disabled={wallets.length === 0}
            title={loc.wallets.import_do_import}
            onPress={() => saveWallet(wallets[selected].wallet)}
          />
        </View>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingTop: 40,
    flex: 1,
  },
  flatListContainer: {
    marginHorizontal: 16,
    marginTop: 30,
  },
  center: {
    marginHorizontal: 16,
    marginTop: 30,
    alignItems: 'center',
  },
  buttonContainer: {
    height: 45,
    marginBottom: 16,
  },
  noWallets: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

ImportCivicWalletDiscovery.navigationOptions = navigationStyle({}, opts => ({ ...opts, title: loc.wallets.import_discovery_title }));

export default ImportCivicWalletDiscovery;