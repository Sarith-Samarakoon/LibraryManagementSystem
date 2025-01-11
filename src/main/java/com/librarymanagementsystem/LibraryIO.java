package com.librarymanagementsystem;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LibraryIO {
    public static void saveItemToFile(List<LibraryItem> libraryItemList, String filename) {
        try(ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(filename))) {
            oos.writeObject(libraryItemList);
            System.out.println("User list saved to the file successfully");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static List<LibraryItem> loadItemsFromFile(String fileName) {
        File file = new File(fileName);
        if(!file.exists()) {
            return new ArrayList<>();
        }

        try(ObjectInputStream ois = new ObjectInputStream(new FileInputStream(fileName))){
            return (List<LibraryItem>) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
    }

    public static void saveUserListToFile(List<User> users, String fileName) {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(fileName))){
            oos.writeObject(users);
            System.out.println("User list saved to the file successfully");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static List<User> loadUserListFromFile(String fileName) {
        File file = new File(fileName);
        if(!file.exists()){
            return new ArrayList<>();
        }

        try(ObjectInputStream ois = new ObjectInputStream(new FileInputStream(fileName))) {
            return (List<User>) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
    }

    public static void saveBorrowedItemsToFile(
            Map<String, String> borrowedItems, String fileName
    ){
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(fileName))){
            oos.writeObject(borrowedItems);
            System.out.println("Borrowed items are write to the file successfully !");
        } catch (IOException e){
            throw new RuntimeException(e);
        }
    }

    public static Map<String, String> loadBorrowedItemsFromFile(String fileName) {
        File file = new File(fileName);
        if(!file.exists()){
            return new HashMap<String, String>();
        }

        try(ObjectInputStream ois = new ObjectInputStream(new FileInputStream(fileName))) {
            return (Map<String, String>) ois.readObject();
        } catch (ClassNotFoundException | IOException e) {
            throw new RuntimeException(e);
        }
    }
}
