import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes,} from "react-router-dom";
import Header from "./Header.tsx";
import RecipeEditorPage from "./recipe/RecipeEditorPage.tsx";
import RecipeMenu from "./recipe/RecipeMenu.tsx";
import RecipePage from "./recipe/RecipePage.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
          <Header />
          <div className="md:container">
            <Routes>
                <Route path='' element={<RecipeMenu />}/>
                <Route path='/new-recipe' element={<RecipeEditorPage />}/>
                <Route path='/manage-ingredients' element={<div>manage ingredients</div>}/>
                <Route path='/recipe/:id' element={<RecipePage />}/>
            </Routes>
          </div>
      </BrowserRouter>
  </StrictMode>,
)
