import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes,} from "react-router-dom";
import {Auth0Provider} from "@auth0/auth0-react";
import Header from "./Header.tsx";
import RecipeEditorPage from "./recipe/RecipeEditorPage.tsx";
import RecipeMenu from "./recipe/RecipeMenu.tsx";
import RecipePage from "./recipe/RecipePage.tsx";
import ImportRecipePage from "./recipe/importing/ImportRecipePage.tsx";
import ManageIngredientsPage from "./Ingredient/ManageIngredientsPage.tsx";
import {ToastProvider} from "./context/ToastContext.tsx";
import {ProtectedRoute} from "./auth/ProtectedRoute.tsx";
import {AuthInterceptor} from "./auth/AuthInterceptor.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
          <Auth0Provider
              domain={import.meta.env.VITE_AUTH0_DOMAIN}
              clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
              authorizationParams={{
                  redirect_uri: window.location.origin,
                  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              }}
          >
              <ToastProvider>
                  <AuthInterceptor />
                  <ProtectedRoute>
                      <Header />
                      <div className="md:container mx-auto">
                          <Routes>
                              <Route path='' element={<RecipeMenu />}/>
                              <Route path='/new-recipe' element={<RecipeEditorPage />}/>
                              <Route path='/recipe/:id/edit' element={<RecipeEditorPage />}/>
                              <Route path='/manage-ingredients' element={<ManageIngredientsPage />}/>
                              <Route path='/recipe/:id' element={<RecipePage />}/>
                              <Route path='/import-recipe' element={<ImportRecipePage />}/>
                          </Routes>
                      </div>
                  </ProtectedRoute>
              </ToastProvider>
          </Auth0Provider>
      </BrowserRouter>
  </StrictMode>,
)
