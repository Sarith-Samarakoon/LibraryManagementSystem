package com.librarymanagementsystem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Library {
    private List<LibraryItem> libraryItems;
    private List<User> userList;
    Map<String, String> borrowedItems;

    public Library() {
        libraryItems = new ArrayList<>();
        borrowedItems = new HashMap<>();
        userList = new ArrayList<>();
    }

    public  void addItem(LibraryItem item) {
        libraryItems.add(item);
    }

    public void addUser(User user) {
        userList.add(user);
    }

    public List<LibraryItem> getLibraryItems() {
        return libraryItems;
    }

    public List<User> getUserList() {
        return userList;
    }

    public void borrowItem(String serialNumber, User user) {
        for(LibraryItem item:libraryItems) {
            if(item.getSerialNumber().equals(serialNumber)){
                if(borrowedItems.containsKey(item.getSerialNumber())){
                    System.out.println("Item "+item.getTitle()+" is already borrowed !");
                    return;
                }
                borrowedItems.put(item.getSerialNumber(), user.getName());
                item.isBorrowed = true;
                System.out.println("Item "+item.getTitle()+" is successfully borrowed by "+user.getName());
                return;
            }
        }
        System.out.println("Item with serial number "+serialNumber+" is not available.");
    }

    public void returnBorrowedItem(String serialNumber, User user){
        for(LibraryItem item:libraryItems) {
            if(item.getSerialNumber().equals(serialNumber)){
                borrowedItems.remove(item.getSerialNumber());
                return;
            }
        }
        System.out.println("Item with serial number "+serialNumber+" is not available.");
    }

    public Map<String, String> getBorrowedItems() {
        return borrowedItems;
    }
}
