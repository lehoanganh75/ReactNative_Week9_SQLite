import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { deleteTask, getTasks, resetDatabase, updateTaskEmail, updateTaskStatus } from '../data/database';

interface Task {
  id: string;
  status: boolean;
  email: string;
  edit: boolean;
}

const UserProfileImage = () => {
  const avatarUrl =
    "https://res.cloudinary.com/ddga6y6tm/image/upload/v1741178088/avatar_rlr5jl.png";

  return <Image source={{ uri: avatarUrl }} style={styles.profileImage} />;
};

const TaskItem = ({ task, onToggleStatus, onEdit, onDelete }: { 
  task: Task; 
  onToggleStatus: (id: string, status: boolean) => void;
  onEdit: (id: string, email: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState(task.email);

  const handleEdit = () => {
    if (isEditing) {
      onEdit(task.id, editedEmail);
    }
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(task.id) }
      ]
    );
  };

  return (
    <View style={styles.taskItem}>
      <TouchableOpacity 
        style={styles.statusBox}
        onPress={() => onToggleStatus(task.id, !task.status)}
      >
        <Ionicons
          name={task.status ? "checkbox-outline" : "square-outline"}
          size={24}
          color={task.status ? "#22c55e" : "#888"}
        />
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          style={styles.editInput}
          value={editedEmail}
          onChangeText={setEditedEmail}
          autoFocus
        />
      ) : (
        <Text style={[styles.taskText, task.status && styles.taskTextCompleted]}>
          {task.email}
        </Text>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons 
            name={isEditing ? "checkmark" : "pencil"} 
            size={20} 
            color={isEditing ? "#22c55e" : "#888"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
      
    </View>
    
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userName = params.userName || "Guest";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      const formattedData = data.map(task => ({
        ...task,
        id: task.id.toString(),
        status: Boolean(task.status)
      }));
      setTasks(formattedData);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      Alert.alert("Error", "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, status: boolean) => {
    try {
      await updateTaskStatus(id, status);
      // Cập nhật local state thay vì reload toàn bộ
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? { ...task, status } : task
        )
      );
    } catch (error) {
      console.error("Failed to update task status:", error);
      Alert.alert("Error", "Failed to update task status");
      // Reload để đồng bộ lại dữ liệu
      loadTasks();
    }
  };

  const handleEditTask = async (id: string, email: string) => {
    if (!email.trim()) {
      Alert.alert("Error", "Task cannot be empty");
      return;
    }

    try {
      await updateTaskEmail(id, email);
      // Cập nhật local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? { ...task, email } : task
        )
      );
    } catch (error) {
      console.error("Failed to update task:", error);
      Alert.alert("Error", "Failed to update task");
      loadTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      // Cập nhật local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
      Alert.alert("Error", "Failed to delete task");
      loadTasks();
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <UserProfileImage />
          <View style={styles.textContainer}>
            <Text style={styles.greeting}>Hi {userName}</Text>
            <Text style={styles.subtitle}>Have a great day ahead</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading tasks...</Text>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No tasks found' : 'No tasks yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Add your first task to get started'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskItem 
                task={item} 
                onToggleStatus={handleToggleStatus}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            )}
            contentContainerStyle={styles.taskList}
          />
        )}
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            router.push({
              pathname: "/add",
              params: { userName: userName },
            })
          }
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
        // Trong home.js, thêm nút reset (tạm thời)

<TouchableOpacity 
  style={styles.resetButton}
  onPress={async () => {
    try {
      await resetDatabase();
      await loadTasks();
      Alert.alert('Success', 'Database reset successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset database');
    }
  }}
>
  <Text style={styles.resetButtonText}>Reset DB</Text>
</TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    justifyContent: "center",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  taskList: {
    paddingVertical: 10,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statusBox: {
    marginRight: 10,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  taskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#06b6d4",
    paddingVertical: 4,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 5,
    marginLeft: 10,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 5,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#06b6d4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  resetButton: {
  backgroundColor: '#ff4444',
  padding: 10,
  borderRadius: 5,
  margin: 10,
},
resetButtonText: {
  color: 'white',
  textAlign: 'center',
},
});