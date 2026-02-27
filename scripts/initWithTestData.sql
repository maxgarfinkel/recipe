TRUNCATE TABLE ingredient, ingredient_quantity, recipe, ingredient_alias;
ALTER SEQUENCE ingredient_seq RESTART WITH 100;
ALTER SEQUENCE ingredient_quantity_seq RESTART WITH 100;
ALTER SEQUENCE recipe_seq RESTART WITH 100;

INSERT INTO ingredient(id, name, default_unit)
VALUES  (1,'Spaghetti', 1),
        (2,'Tinned Tomato', 19),
        (3,'Chopped Onion', 19),
        (4,'Garlic Clove', 19),
        (5,'Salt', 15),
        (6,'Capers', 9);

INSERT INTO recipe(id, name, method, servings)
VALUES (1,'Pasta al pomodoro', 'Soften the garlic: In a large saucepan over medium-low heat, stir together 1/4 cup of the oil and the garlic until the garlic begins to sizzle, about 2 minutes. Press down on the garlic to release its flavor but don’t let it brown. Stir in a pinch of red pepper flakes. For a milder flavor, remove and discard the garlic, keeping the garlicky oil in the pan. Or leave it in for a bolder flavor—your choice.
Add the tomatoes: Pour in the can of tomatoes and their juice. Watch for spatters as the tomatoes hit the oil. Use a potato masher, sturdy wooden spoon, or silicone spatula to break up the tomatoes. Season with 1/2 teaspoon of salt and raise the heat to medium-high. Bring the tomatoes to a boil, then lower the heat to medium-low or low to maintain a very gentle simmer.
Simmer the sauce: Cover the pan partially with a lid and cook, stirring every now and then, for 35 to 40 minutes, until the tomatoes have darkened in color and the sauce has thickened. The oil should be pooling on the surface. If the sauce thickens too much before it tastes sweeter and richer, add a splash of water. When it’s finished cooking, turn off the heat and let sit for 10 minutes to cool.
Process the sauce: Strain the sauce with a food mill or fine mesh strainer. Discard the garlic and transfer the sauce to a food mill fitted with the disk with the smallest holes. Pass the sauce through the mill into a bowl. Or, press the tomatoes through a sieve or fine mesh strainer to make a smooth sauce. Return the sauce to the pan. Taste and add another pinch of salt, if needed.
Season the pomodoro sauce: Stir in the remaining 2 tablespoons of olive oil. Lay the branch of basil on top of the sauce and bring to a simmer over medium heat. Or scatter about 5 basil leaves into the pan. Stir the sauce and cook gently for about 15 minutes. The basil will wilt into the sauce and infuse it with flavor. Turn off the heat and discard the branch of basil. Add a few more fresh basil leaves if you’d like. You can leave them whole or tear them; either is fine. Cover the pan to keep the sauce warm.
Combine: Bring a large pot of water to a rolling boil and salt it generously. Drop in the pasta and cook according to the package instructions until just al dente. Use a pasta fork, tongs, or a skimmer to transfer the pasta directly to the pan with the sauce. Add a splash of the starchy pasta water and turn the heat under the pan on to low. Cook, tossing pasta and sauce together, for about 2 minutes, or until the noodles are cooked and well coated with the sauce.

Serve: Divide the pasta between bowls and spoon any remaining sauce on top. Sprinkle with Parmigiano cheese and basil and serve.', 4);

INSERT INTO ingredient_quantity(id, quantity, recipe_id, ingredient_id, unit_id)
VALUES  (1, 250, 1, 1, 1),   -- 250g Spaghetti
        (2, 1,   1, 2, 19),  -- 1 Tinned Tomato
        (3, 1,   1, 3, 19),  -- 1 Chopped Onion
        (4, 3,   1, 4, 19),  -- 3 Garlic Cloves
        (5, 1,   1, 5, 15),  -- 1 Pinch Salt
        (6, 1,   1, 6, 9);   -- 1 tbsp Capers

INSERT INTO recipe(id, name, method, servings)
VALUES (2,'Tomato soup', 'step 1
First, prepare your vegetables. You need 1-1.25kg/2lb 4oz-2lb 12oz ripe tomatoes. If the tomatoes are on their vines, pull them off. The green stalky bits should come off at the same time, but if they don''t, just pull or twist them off afterwards. Throw the vines and green bits away and wash the tomatoes. Now cut each tomato into quarters and slice off any hard cores (they don''t soften during cooking and you''d get hard bits in the soup at the end). Peel 1 medium onion and 1 small carrot and chop them into small pieces. Chop 1 celery stick roughly the same size.
step 2
Spoon 2 tbsp olive oil into a large heavy-based pan and heat it over a low heat. Hold your hand over the pan until you can feel the heat rising from the oil, then tip in the onion, carrot and celery and mix them together with a wooden spoon. Still with the heat low, cook the vegetables until they''re soft and faintly coloured. This should take about 10 minutes and you should stir them two or three times so they cook evenly and don’t stick to the bottom of the pan.
step 3
Holding the tube over the pan, squirt in about 2 tsp of tomato purée, then stir it around so it turns the vegetables red. Shoot the tomatoes in off the chopping board, sprinkle in a good pinch of sugar and grind in a little black pepper. Tear 2 bay leaves into a few pieces and throw them into the pan. Stir to mix everything together, put the lid on the pan and let the tomatoes stew over a low heat for 10 minutes until they shrink down in the pan and their juices flow nicely. From time to time, give the pan a good shake – this will keep everything well mixed.
step 4
Slowly pour in the 1.2 litres/2 pints of hot stock (made with boiling water and 4 rounded tsp bouillon powder or 2 stock cubes), stirring at the same time to mix it with the vegetables. Turn up the heat as high as it will go and wait until everything is bubbling, then turn the heat down to low again and put the lid back on the pan. Cook gently for 25 minutes, stirring a couple of times. At the end of cooking the tomatoes will have broken down and be very slushy-looking.
step 5
Remove the pan from the heat, take the lid off and stand back for a few seconds or so while the steam escapes, then fish out the pieces of bay leaf and throw them away. Ladle the soup into your blender until it’s about three-quarters full, fit the lid on tightly and turn the machine on full. Blitz until the soup’s smooth (stop the machine and lift the lid to check after about 30 seconds), then pour the puréed soup into a large bowl. Repeat with the soup that’s left in the pan. (The soup may now be frozen for up to three months. Defrost before reheating.)
step 6
Pour the puréed soup back into the pan and reheat it over a medium heat for a few minutes, stirring occasionally until you can see bubbles breaking gently on the surface. Taste a spoonful and add a pinch or two of salt if you think the soup needs it, plus more pepper and sugar if you like. If the colour’s not a deep enough red for you, plop in another teaspoon of tomato purée and stir until it dissolves. Ladle into bowls and serve. Or sieve and serve chilled with some cream swirled in.', 4);

INSERT INTO ingredient_quantity(id, quantity, recipe_id, ingredient_id, unit_id)
VALUES
        (7,  1, 2, 2, 19),  -- 1 Tinned Tomato
        (8,  1, 2, 3, 19),  -- 1 Chopped Onion
        (9,  3, 2, 4, 19),  -- 3 Garlic Cloves
        (10, 1, 2, 5, 15);  -- 1 Pinch Salt