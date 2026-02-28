import './Header.css';
import {useState} from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function Header() {

    const [showMenu, setShowMenu] = useState(false);
    const { logout } = useAuth0();

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

                    <div className={"bg-dark grid transition-[grid-template-rows] ease-in-out duration-700 " + (showMenu ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <div className="overflow-hidden">
                        <div className="md:container mx-auto text-right text-white font-sans font-light">
                            <ul className="p-2">
                                <li className="pb-2">
                                    <Link onClick={() => {setShowMenu(!showMenu)}} to={`/`}>Home</Link>
                                </li>
                                <li className="pb-2">
                                    <Link onClick={() => {setShowMenu(!showMenu)}} to={`/new-recipe`}>Add recipe</Link>
                                </li>
                                <li className="pb-2">
                                    <Link onClick={() => {setShowMenu(!showMenu)}} to={`/import-recipe`}>Import recipe</Link>
                                </li>
                                <li className="pb-2">
                                    <Link onClick={() => {setShowMenu(!showMenu)}} to={`/manage-ingredients`}>Manage ingredients</Link>
                                </li>
                                <li>
                                    <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                        </div>
                    </div>

                </header>
        </>
    );
}

export default Header;