import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ItemEntity {
  id: number;
  done: boolean;
  value: string;
}

export default function App() {
  return (
    <SQLiteProvider databaseName="db.db" onInit={migrateDbIfNeeded}>
      <Main />
    </SQLiteProvider>
  );
}

function Main() {
  const db = useSQLiteContext();
  const [text, setText] = useState('');
  const [todoItems, setTodoItems] = useState<ItemEntity[]>([]);
  const [status, setStatus] = useState(false);

  const refetchItems = useCallback(() => {
    async function refetch() {
      await db.withExclusiveTransactionAsync(async () => {
        setTodoItems(
          await db.getAllAsync<ItemEntity>(
            'SELECT * FROM items',
            false
          )
        );
      });
    }
    refetch();
  }, [db]);

  useEffect(() => {
    refetchItems();
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', marginBottom: 10, justifyContent: 'space-between' }}>
        <TouchableOpacity>
          <Image source={require('../assets/images/icon2.png')} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginLeft: 10, }}>
          <Image source={require('../assets/images/Frame.png')} />
          <View>
            <Text style={{ fontWeight: 700 }}>Hi Hoang Anh</Text>
            <Text>Have agreat day a head</Text>
          </View>
        </View>
      </View>
      <View style={styles.flexRow}>
        <View style={{
          borderLeftWidth: 1,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          height: 48,
          justifyContent: 'center'
        }}>
          <Image source={require('../assets/images/search.png')} style={{

          }} />
        </View>
        <TextInput
          onChangeText={(text) => setText(text)}
          value={text}
          placeholder="Search"
          style={styles.input}
        />
      </View>

      <ScrollView style={styles.listArea}>
        <View style={styles.sectionContainer}>
          {todoItems.map((item) => (
            <Item
              key={item.id}
              item={item}
              onDelete={async (id) => {
                await deleteItemAsync(db, id);
                await refetchItems();
              }}
              onMarkDone={async (id) => {
                await updateItemAsDoneAsync(db, id);
                await refetchItems();
              }}
            />
          ))}
        </View>
      </ScrollView>
      <View style={{ alignItems: 'center', }}>
        <TouchableOpacity
          onPress={async () => {
            await addItemAsync(db, text);
            await refetchItems();
            setText('');
          }}
          style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Item({
  item,
  onMarkDone,
  onDelete,
}: {
  item: ItemEntity;
  onMarkDone: (id: number) => void | Promise<void>;
  onDelete: (id: number) => void | Promise<void>;
}) {
  const { id, done, value } = item;

  const toggleDone = async () => {
    await onMarkDone(id);
  };

  return (
    <View style={[styles.item, done && styles.itemDone]}>
      <TouchableOpacity style={{ justifyContent: 'center', width: 40, height: 40 }} onPress={toggleDone}>
        <Text style={styles.actionText}>{done ? (<Text style={{ backgroundColor: 'green', padding: 10, borderRadius: 10, textAlign: 'center' }}>V</Text>) : (<Text style={{ backgroundColor: 'red', padding: 10, borderRadius: 10, textAlign: 'center' }}>X</Text>)}</Text>
      </TouchableOpacity>
      <View style={styles.itemTextContainer}>
        <Text style={[styles.itemText, done && styles.itemTextDone]}>{value}</Text>
      </View>
      <View style={styles.itemActions}>


        <TouchableOpacity onPress={() => onDelete(id)} style={styles.deleteButton}>
          <Text style={styles.actionText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

async function addItemAsync(db: SQLiteDatabase, text: string): Promise<void> {
  try {
    if (text.trim() !== '') {
      await db.runAsync('INSERT INTO items (done, value) VALUES (?, ?);', false, text);
    }
  } catch (error) {
    console.error('Error adding item:', error);
  }
}


async function updateItemAsDoneAsync(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('UPDATE items SET done = ? WHERE id = ?;', true, id);
}

async function deleteItemAsync(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM items WHERE id = ?;', id);
}

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version');
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, done INT, value TEXT);
    `);
    currentDbVersion = 1;
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flex: 1,
    height: 48,
    padding: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4630eb',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 30,
  },
  listArea: {
    flex: 1,
    marginTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDone: {
    backgroundColor: '#1c9963',
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10
  },
  itemStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  itemText: {
    color: '#000',
    fontSize: 16,
  },
  itemTextDone: {
    color: '#fff',
    textDecorationLine: 'line-through',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 20,
    fontSize: 13,
  },
  markDoneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
