import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CartItem } from '../common/cart-item';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cartItems: CartItem[] = [];
  totalPrice: Subject<number> = new BehaviorSubject<number>(0);
  totalQuantity: Subject<number> = new BehaviorSubject<number>(0);

//Data will be lost if close the web browser.
  //storage:Storage =sessionStorage;  

  //data will be persisted and survive brower restarts
  storage:Storage =localStorage; 

  constructor() { 
    let data=JSON.parse(this.storage.getItem('cartItems'));
    if (data!= null){
      this.cartItems=data;
      this.computerCartTotals();
    }
  }

  addToCart(theCartItem: CartItem) {
    // check if we already have
    let alreayHave: boolean = false;
    let existingCartItem: CartItem = undefined!;

    // if cart is not null
    if (this.cartItems.length > 0) {
      // go through the cart and find if it already have thecartitem that we want to buy
      existingCartItem = this.cartItems.find(temp => temp.id === theCartItem.id)!;

      // set the alreadyhave to represent whether we found.
      alreayHave = (existingCartItem != undefined);
    }

    //
    if (alreayHave) {
      existingCartItem.quantity++;
    } else {
      this.cartItems.push(theCartItem);
    }

    this.computerCartTotals();
  }// addToCart() function ends.


  computerCartTotals() {
    let totalPriceValue: number = 0;
    let totalQuantityValue: number = 0;
    for (let item of this.cartItems) {
      totalPriceValue += item.unitPrice * item.quantity;
      totalQuantityValue += item.quantity;
    }
    //publish the new values
    this.totalPrice.next(totalPriceValue);
    this.totalQuantity.next(totalQuantityValue);

    this.logCartData(totalPriceValue, totalQuantityValue);
    this.persistCartItems();

  }
  //computerCartTotals ends.


persistCartItems(){
  this.storage.setItem('cartItems',JSON.stringify(this.cartItems));
}


  logCartData(totalPriceValue: number, totalQuantityValue: number) {
    console.log(`Contents of the cart`);
    for (let temp of this.cartItems) {
      const subTotalPrice = temp.quantity * temp.unitPrice;
      console.log(`caritem name=${temp.name}, quantity=${temp.quantity}, subtotalprice=${subTotalPrice}`);
    }
    console.log(`totalprice is ${totalPriceValue.toFixed(2)}, totalquantityvalue is${totalQuantityValue} `);
  }
  //logCartData function ends.

  decrementQuantity(theCartItem: CartItem) {
    theCartItem.quantity--;
    if (theCartItem.quantity == 0) {
      this.remove(theCartItem);
    } else {
      this.computerCartTotals();
    }
  } //decrementQuantity ends



  remove(theCartItem: CartItem) {
    //get index of the item
    const itemindex = this.cartItems.findIndex(temp => temp.id == theCartItem.id);
    //found, remove
    if (itemindex > -1) {
      this.cartItems.splice(itemindex, 1);

      this.computerCartTotals();
    }// remove ends. called by decrementQuantity function
    

  }









}// class ends.
