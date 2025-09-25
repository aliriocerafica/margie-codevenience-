"use client";

import React from 'react';
import {
  Navbar as HNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Input,
  Avatar,
  Badge
} from "@heroui/react";
import { Search, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";

const Navbar: React.FC = () => {
  return (
    <HNavbar maxWidth="full" isBordered className="bg-white dark:bg-gray-900">
      <NavbarBrand>
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/Logo.png" alt="Logo" className="h-6 w-6" />
          <span className="font-semibold hidden sm:inline">Margie CodeVenience</span>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden md:flex" justify="center">
        <NavbarItem>
          <Input
            size="sm"
            radius="lg"
            placeholder="Search..."
            startContent={<Search size={16} />}
            classNames={{
              inputWrapper: "h-9 border border-gray-200 dark:border-gray-800 bg-transparent"
            }}
          />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <NavbarItem>
          <Button isIconOnly variant="light">
            <Badge color="danger" content="1" placement="top-right">
              <Bell size={18} />
            </Badge>
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button variant="light" className="flex items-center gap-2">
                <Avatar size="sm" name="Johnathan" className="bg-yellow-100 text-yellow-800" />
                <span className="hidden md:inline text-sm">Johnathan</span>
                <ChevronDown size={16} className="hidden md:inline" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile">
                <Link href="/profile">Profile</Link>
              </DropdownItem>
              <DropdownItem key="settings">Settings</DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger">Logout</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </HNavbar>
  );
};

export default Navbar;