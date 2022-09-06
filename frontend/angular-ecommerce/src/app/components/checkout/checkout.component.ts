import { group } from '@angular/animations';
import { SafeKeyedRead } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { PaymentInfo } from 'src/app/common/payment-info';
import { Purchase } from 'src/app/common/purchase';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { FormValidators } from 'src/app/validators/form-validators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup!: FormGroup;
  totalPrice: number = 0;
  totalQuantity: number = 0;
  storage: Storage = sessionStorage;

  // initialize stripe api
  stripe = Stripe(environment.stripePublishableKey);
  cardElement: any;
  displayError: any = '';
  paymentInfo: PaymentInfo = new PaymentInfo();

  constructor(private formBuilder: FormBuilder,
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private router: Router) { }

  ngOnInit(): void {
    this.reviewCartDetails();
    this.setupStripePaymentForm();
    const theEmail = JSON.parse(this.storage.getItem('userEmail'));

    this.checkoutFormGroup = this.formBuilder.group({
      //customer info
      customer: this.formBuilder.group({
        firstName: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace]),
        lastName: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace]),
        email: new FormControl(theEmail, [Validators.required,
        Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),

      // shipping info
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace]),
        city: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace])
      }),

      //billing info
      billingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace]),
        city: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required,
        Validators.minLength(2),
        FormValidators.notOnlyWhitespace])
      }),


      //card info
      creditCard: this.formBuilder.group({

      })
    });
  }
  setupStripePaymentForm() {
    //get a handle to stripe element
    var elements = this.stripe.elements();
    //create card
    this.cardElement = elements.create('card', { hidePostalCode: true });
    //add an instance of card UI component into the card element div
    this.cardElement.mount('#card-element');
    //add event
    this.cardElement.on('change', (event) => {
      this.displayError = document.getElementById('card-errors');
      if (event.complete) {
        this.displayError.textContent = "";
      } else if (event.error) {
        this.displayError.textContent = event.error.message;

      }
    });
  }




  onSubmit() {
    console.log("Handling the submit button");

    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    // set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    // get cart items
    const cartItems = this.cartService.cartItems;

    // create orderItems from cartItems
    // - long way
    /*
    let orderItems: OrderItem[] = [];
    for (let i=0; i < cartItems.length; i++) {
      orderItems[i] = new OrderItem(cartItems[i]);
    }
    */

    // - short way of doing the same thingy
    let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    // set up purchase
    let purchase = new Purchase();

    // populate purchase - customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;

    // populate purchase - shipping address
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    // populate purchase - billing address
    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;

    // populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;


    this.paymentInfo.amount = this.totalPrice * 100;
    this.paymentInfo.currency = "USD";
    this.paymentInfo.receiptEmail=purchase.customer.email;

    //if valid form then create a payment intent

    if (!this.checkoutFormGroup.invalid && this.displayError.textContent === "") {
      console.log("valid");
      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(
        (paymentIntentResponse) => {
          this.stripe.confirmCardPayment(paymentIntentResponse.client_secret,
            {
              payment_method: {
                card: this.cardElement,
                billing_details:{
                  email:purchase.customer.email,
                  name:`${purchase.customer.firstName}  ${purchase.customer.lastName}`,
                  address:{
                    line1:purchase.billingAddress.street,
                    city:purchase.billingAddress.city,
                    state:purchase.billingAddress.state,
                    postal_code:purchase.billingAddress.zipCode,
                    country:purchase.billingAddress.country
                  }
                }
              }
            }, { handleActions: false })
          .then(function(result) {
            if (result.error) {
              // inform the customer there was an error
              alert(`There was an error: ${result.error.message}`);
            } else {
              // call REST API via the CheckoutService
              console.log("successful");
              this.checkoutService.placeOrder(purchase).subscribe({
                next: response => {
                  alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

                  // reset cart
                  this.resetCart();
                },
                error: err => {
                  alert(`There was an error: ${err.message}`);
                }
              })
            }            
          }.bind(this));
        }
      );
    } else {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

  }

  resetCart() {
    // reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);

    // reset the form
    this.checkoutFormGroup.reset();

    // navigate back to the products page
    this.router.navigateByUrl("/products");
  }


  //get customer getter
  get firstName() {
    return this.checkoutFormGroup.get('customer.firstName');
  }
  get lastName() {
    return this.checkoutFormGroup.get('customer.lastName');
  }
  get email() {
    return this.checkoutFormGroup.get('customer.email');
  }

  //shipping getter handler to form control
  get shippingStreet() {
    return this.checkoutFormGroup.get('shippingAddress.street');
  }
  get shippingCity() {
    return this.checkoutFormGroup.get('shippingAddress.city');
  }
  get shippingState() {
    return this.checkoutFormGroup.get('shippingAddress.state');
  }
  get shippingCountry() {
    return this.checkoutFormGroup.get('shippingAddress.country');
  }
  get shippingZipCode() {
    return this.checkoutFormGroup.get('shippingAddress.zipCode');
  }


  //billing getter handler to form control
  get billingStreet() {
    return this.checkoutFormGroup.get('billingAddress.street');
  }
  get billingCity() {
    return this.checkoutFormGroup.get('billingAddress.city');
  }
  get billingState() {
    return this.checkoutFormGroup.get('billingAddress.state');
  }
  get billingCountry() {
    return this.checkoutFormGroup.get('billingAddress.country');
  }
  get billingZipCode() {
    return this.checkoutFormGroup.get('billingAddress.zipCode');
  }

  //Credit card getter handler to form control
  get cardType() {
    return this.checkoutFormGroup.get('creditCard.cardType');
  }
  get cardNumber() {
    return this.checkoutFormGroup.get('creditCard.cardNumber');
  }
  get nameOnCard() {
    return this.checkoutFormGroup.get('creditCard.nameOnCard');
  }
  get securityCode() {
    return this.checkoutFormGroup.get('creditCard.securityCode');
  }
  get expirationMonth() {
    return this.checkoutFormGroup.get('creditCard.expirationMonth');
  }
  get expirationYear() {
    return this.checkoutFormGroup.get('creditCard.expirationYear');
  }



  copyShippingAddressToBillingAddress(event: any) {

    if (event.target.checked) {
      this.checkoutFormGroup.controls['billingAddress']
        .setValue(this.checkoutFormGroup.controls['shippingAddress'].value);

    }
    else {
      this.checkoutFormGroup.controls['billingAddress'].reset();
    }
  }



  reviewCartDetails() {
    //subscribe to cartservice totalQuantity and totalprice
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity);

    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice);
  }


}
