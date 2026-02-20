import './Header.css';
import {useState} from "react";
import { Link } from "react-router-dom";

function Header() {

    const [showMenu, setShowMenu] = useState(false);

    return (<>
                <header className="w-full">
                    <div className="bg-dark ">
                        <div className="md:container mx-auto font-sans text-xl text-white bg-dark p-3">
                            <Link to={'/'}>:RecipeBook</Link>
                            <div className="float-right cursor-pointer" onClick={() => {
                                setShowMenu(!showMenu)
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5}
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className={"bg-dark overflow-clip transition-[max-height] ease-in-out duration-700 " + (showMenu ? "max-h-32" : "max-h-0") + " ..."}>
                        <div className="md:container mx-auto text-right text-white font-sans font-light">
                            <ul className="p-2">
                                <li className="pb-2">
                                    <Link onClick={() => {setShowMenu(!showMenu)}} to={`/`}>Home</Link>
                                </li>
                                <li className="pb-2">
                                    <Link onClick={() => {setShowMenu(!showMenu)}} to={`/new-recipe`}>Add recipe</Link>
                                </li>
                                <li>
                                    <Link onClick={() => {setShowMenu(!showMenu)}} to={`/manage-ingredients`}>Manage ingredients</Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                </header>
        </>
    );
}

export default Header;