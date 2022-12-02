/**
 * @jest-environment jsdom
 */
 import '@testing-library/jest-dom'
 import { screen, fireEvent, waitFor } from '@testing-library/dom'
 import NewBillUI from '../views/NewBillUI.js'
 import NewBill from '../containers/NewBill.js'
 import { ROUTES, ROUTES_PATH } from '../constants/routes'
 import { localStorageMock } from '../__mocks__/localStorage.js'
 import userEvent from '@testing-library/user-event'
 import mockStore from '../__mocks__/store.js'
 import router from '../app/Router.js'
 
 jest.mock('../app/store', () => mockStore)
 

 describe('Given I am connected as an employee', () => {
   beforeEach(() => {
     // On commence par afficher les données de la page employé
     Object.defineProperty(window, 'localStorage', { value: localStorageMock })
     window.localStorage.setItem(
       'user',
       JSON.stringify({
         type: 'Employee',
         email: 'a@a',
       })
     )
   })


   describe('When I am on NewBill Page', () => {
     // L'icône mail doit être en surbrillance
     test('Then mail icon in vertical layout should be highlighted', async () => {
       const root = document.createElement('div')
       root.setAttribute('id', 'root')
       document.body.append(root)
       router()
       window.onNavigate(ROUTES_PATH.NewBill)
       await waitFor(() => screen.getByTestId('icon-mail'))
       const mailIcon = screen.getByTestId('icon-mail') // On récupère l'icône par son testid
       expect(mailIcon).toHaveClass('active-icon') // On check si l'icône est en surbrillance (vérification de la classe correspondante)
     })

     // Le formulaire doit être présent à l'écran avec tous ses champs
     test('Then the form should be displayed', () => {
       const html = NewBillUI()
       document.body.innerHTML = html
       expect(screen.getByTestId('form-new-bill')).toBeTruthy()
       expect(screen.getByTestId('expense-type')).toBeTruthy()
       expect(screen.getByTestId('expense-name')).toBeTruthy()
       expect(screen.getByTestId('datepicker')).toBeTruthy()
       expect(screen.getByTestId('amount')).toBeTruthy()
       expect(screen.getByTestId('vat')).toBeTruthy()
       expect(screen.getByTestId('pct')).toBeTruthy()
       expect(screen.getByTestId('commentary')).toBeTruthy()
       expect(screen.getByTestId('file')).toBeTruthy()
       expect(screen.getByRole('button')).toBeTruthy()
     })


     // Tests pour l'upload de fichier
     describe('When I upload a file', () => {
       // On clear tous les mocks avant et après chaque test, pour s'assurer que chaque test tourne bien avec le mock correct
       beforeEach(() => {
         jest.clearAllMocks()
       })
       afterEach(() => {
         jest.clearAllMocks()
       })

       // On peut sélectionner un fichier png jpg ou jpeg
       test('Then, I can select a png, jpg or jpeg file', () => {
         // On affiche les données de la page
         const html = NewBillUI()
         document.body.innerHTML = html
         const onNavigate = (pathname) => {
           document.body.innerHTML = ROUTES({ pathname })
         }
         const newBillContainer = new NewBill({
           document,
           onNavigate,
           store: mockStore,
           localStorage: window.localStorage,
         })
 
         const changeFile = jest.fn((e) => newBillContainer.handleChangeFile(e)) // On crée la fonction à tester
         const file = screen.getByTestId('file') // On récupère l'input file
         expect(file).toBeTruthy() // On vérifie qu'il soit bien présent à l'écran
 
         const testFile = new File(['sample.jpg'], 'sample.jpg', {
           type: 'image/jpg',
         }) // On crée un fichier de type jpg à tester
 
         file.addEventListener('change', changeFile) // On écoute la fonction au changement de fichier
         userEvent.upload(file, testFile) // On upload le fichier test
 
         expect(changeFile).toHaveBeenCalled() // On s'attend à ce que la fonction ait été appellée
         expect(file.files[0]).toEqual(testFile) // On vérifie que le fichier uploadé est bien le fichier test
         expect(file.files[0].name).toBe('sample.jpg') // On vérifie que le nom du fichier correspond au fichier test
 
         jest.spyOn(window, 'alert').mockImplementation(() => {}) // On mock l'appel de l'alerte
         expect(window.alert).not.toHaveBeenCalled() // On s'attend à ce que l'alerte n'ai pas été appellée
       })

       // On ne peut pas upload un fichier qui n'est pas une image
       test("Then, I can't select a non-image file, and the page displays an alert", () => {
         const html = NewBillUI()
         document.body.innerHTML = html
         const onNavigate = (pathname) => {
           document.body.innerHTML = ROUTES({ pathname })
         }
         const newBillContainer = new NewBill({
           document,
           onNavigate,
           store: mockStore,
           localStorage: window.localStorage,
         })
 
         const changeFile = jest.fn(newBillContainer.handleChangeFile)
         const file = screen.getByTestId('file')
         expect(file).toBeTruthy()
 
         const testFile = new File(['sample test file'], 'sample.txt', {
           type: 'text/plain',
         }) // On crée un fichier à tester de type texte
 
         file.addEventListener('change', changeFile)
         userEvent.upload(file, testFile) // On upload le fichier test
 
         expect(changeFile).toHaveBeenCalled()
         expect(file.files[0].name).not.toBe('sample.png') // On s'attend à ce que le nom du fichier ne soit pas sample.png
         expect(file.files[0].type).not.toBe('image/png') // On s'attend à ce que le type de fichier ne soit pas une image png
 
         jest.spyOn(window, 'alert').mockImplementation(() => {}) // On mock l'appel de l'alerte
         expect(window.alert).toHaveBeenCalled() // On s'attend à ce que l'alerte ait été appellée
         expect(file.value).toBe('') // On s'attend à ce que l'input file ait été vidé
       })
     })
   })
 })
 
 // Test d'intégration POST
 describe('Given I am a user connected as Employee', () => {
   describe('When I submit a completed form', () => {
     test('Then a new bill should be created', async () => {
       const html = NewBillUI()
       document.body.innerHTML = html
 
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
 
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem(
         'user',
         JSON.stringify({
           type: 'Employee',
           email: 'azerty@email.com',
         })
       )
 
       const newBill = new NewBill({
         document,
         onNavigate,
         store: mockStore,
         localStorage: window.localStorage,
       })

       // On crée les données d'une note de frais à tester
       const sampleBill = {
         type: 'Hôtel et logement',
         name: 'HotelLimperial',
         date: '2000-10-10',
         amount: 250,
         vat: 45,
         pct: 8,
         commentary: 'Test POST',
         fileUrl:
           'https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
         fileName: 'preview-facture-free-201801-pdf-1.jpg',
         status: 'pending',
       }
 
       // On charge les données dans les champs correspondants
       screen.getByTestId('expense-type').value = sampleBill.type
       screen.getByTestId('expense-name').value = sampleBill.name
       screen.getByTestId('datepicker').value = sampleBill.date
       screen.getByTestId('amount').value = sampleBill.amount
       screen.getByTestId('vat').value = sampleBill.vat
       screen.getByTestId('pct').value = sampleBill.pct
       screen.getByTestId('commentary').value = sampleBill.commentary
 
       newBill.fileName = sampleBill.fileName
       newBill.fileUrl = sampleBill.fileUrl
       newBill.updateBill = jest.fn() // On crée une fonction d'update
       const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)) // On crée une fonction de submit
 
       const form = screen.getByTestId('form-new-bill') // On récupère le formulaire
       form.addEventListener('submit', handleSubmit) // On écoute le submit
       fireEvent.submit(form) // On lance le submit
 
       expect(handleSubmit).toHaveBeenCalled() // On s'attend à ce que la fonction submit ait été appellée
       expect(newBill.updateBill).toHaveBeenCalled() // On s'attend à ce que la fonction d'update ait été appellée
     })

     // Test erreur API
     test('fetches error from an API and fails with 500 error', async () => {
       jest.spyOn(mockStore, 'bills')
       jest.spyOn(console, 'error').mockImplementation(() => {})
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       Object.defineProperty(window, 'location', {
         value: { hash: ROUTES_PATH['NewBill'] },
       })
 
       window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
       document.body.innerHTML = `<div id="root"></div>`
       router()
 
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
 
       mockStore.bills.mockImplementationOnce(() => {
         return {
           update: () => {
             return Promise.reject(new Error('Erreur 500'))
           },
         }
       })
       const newBill = new NewBill({
         document,
         onNavigate,
         store: mockStore,
         localStorage: window.localStorage,
       })
 
       // Submit form
       const form = screen.getByTestId('form-new-bill')
       const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
       form.addEventListener('submit', handleSubmit)
       fireEvent.submit(form)
       await new Promise(process.nextTick)
       expect(console.error).toBeCalled() // On s'attend à ce qu'une erreur soit appelée dans la console
     })
   })
 })

 